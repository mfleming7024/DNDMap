'use strict';

angular.module('myApp')
.controller('mainController', ['$scope', 'MongoURLService', 'IngredientsService', 'leafletData', function($scope, MongoURLService, IngredientsService, leafletData) {

	angular.extend($scope, {
		defaults: {crs: 'Simple'},
		center: {},
		maxBounds: {
			northEast: {},
			southWest: {}
		},
		paths: {},	
		markers: {},
		layers: {
			baselayers: {},
			overlays: {}
		},
		events: {
            map: {
                enable: ['click','baselayerchange','contextmenu'],
                logic: 'emit'
            },
			path: {
				enable: ['click', 'mouseover', 'mouseout', 'contextmenu'],
                logic: 'emit'
			}
        }
	});


	/*TODO
	* - Move plants and potions to their own controllers, 
	*/

	// indexing options for fuse
	var options = { 
		keys: ['message'], 
		includeScore: true
	};
	var fuse;


	// Return a list of filtered markers that are unverified
	var getUnverifiedMarkers = function() {
		// Parse number of unverified markers in array
		var unverified = $scope.markers.filter(function(item){
			return item.unverified == true;
		})

		return unverified;
	}

	// Finalize and send data for unverified markers once data filled in
	$scope.finalize = function() {
		var unverified = getUnverifiedMarkers();

		// go through each unverified point and add it 
		unverified.forEach(function(item){
			MongoURLService.addPoint($scope.mapName.toLowerCase(), item.message, Number(item.lat), Number(item.lng)).then(function(response){
				console.log('AddPoint: ', response);
				item.unverified = false;
			})
		});

		$scope.unverified = getUnverifiedMarkers().length;
	}

	$scope.displaySearchModal = false;
	// Toggle visibility of the search modal
	$scope.toggleSearchModal = function() {
		$scope.searchThing = "";
		$scope.displaySearchModal = !$scope.displaySearchModal;
	}

	// On Change function for searching things
	$scope.search = function(thing) {
		$scope.results = fuse.search(thing);
	}

	// Smooth pan the map to specified coords
	$scope.flyTo = function(latitude, longitude) {
		leafletData.getMap('map').then(function(mapRef) {
			$scope.toggleSearchModal();
			mapRef.flyTo({lat: latitude, lng: longitude});
		});
	}

	var counter = 0;
	$scope.enableGodMode = function() {
		if ($scope.godMode) {
			return;
		} else if (counter > 1) {
			$scope.godMode = true;
		} else {
			counter++;
		}
	}

	$scope.toggleOverlay = function(overlayName) {
		if (!$scope.godMode) {
			return;
		}

		switch (overlayName) {
			case 'potion':
				$scope.showPotionLab = !$scope.showPotionLab;
				break;
			case 'garden':
				$scope.showGarden = !$scope.showGarden;
				break;
			default:
				break;
		}
	}

	var loadMaps = function() {
		MongoURLService.getMaps().then(function(data){

			// Grab faerun map data and move it to the front of the list
			var faerun = data.data.filter(function(blah){
				return blah.mapName == "faerun";
			});
			var faerunIndex = data.data.indexOf(faerun[0]);

			data.data.unshift(data.data.splice(faerunIndex, 1)[0]);

			console.log('GetMaps:',data);

			for (var i = 0; i < data.data.length; i++) {
				$scope.layers.baselayers[data.data[i].mapName] = {
					name: data.data[i].mapActual,
					type: 'imageOverlay',
					url: "/"+data.data[i].image,
					bounds: data.data[i].bounds,
					layerParams: {
						noWrap: true,
						mongo: {
							name: data.data[i].mapName,
							center: {
								lat: data.data[i].mapCenter.lat,
								lng: data.data[i].mapCenter.lng,
								zoom: data.data[i].zoom
							},
							maxBounds: {
								northEast: {lat: data.data[i].bounds[1][0],lng: data.data[i].bounds[1][1]},
								southWest: {lat: 0,lng: 0}
							}
						}

					}
				}
			}

			$scope.center = {
				lat: faerun[0].mapCenter.lat,
				lng: faerun[0].mapCenter.lng,
				zoom: faerun[0].zoom
			}

			$scope.maxBounds = {
				northEast: {lat: faerun[0].bounds[1][0],lng: faerun[0].bounds[1][1]},
				southWest: {lat: 0,lng: 0}
			};

			$scope.mapName = faerun[0].mapActual;
			loadPaths(faerun[0].mapName);
			loadMarkers(faerun[0].mapName);
		});
		loadPlants();
		loadPotions();
	}

	var loadMarkers = function(mapName) {
		MongoURLService.getMarkers(mapName).then(function(response){
			console.log('GetMarkers: (',mapName,')', response);
			if (angular.isDefined(response.data) && response.data.length !== 0) {
				var resData = response.data;	

				// Colors table for marker color designation
				var colors = {
					poi: "red",
					city: "blue",
					user: "green",
					'shopping-cart': "yellow"
				}

				$scope.markers = [];

				for (var i = 0; i < resData.length; ++i)
					if (resData[i] !== undefined)

						$scope.markers.push({
							lat: resData[i].coords.lat,
							lng: resData[i].coords.lng,
							message: resData[i].label,
							icon: {
								type: 'awesomeMarker',
								prefix: 'fa',
			                    icon: resData[i].type ? resData[i].type !== 'poi' ? resData[i].type : 'tag' : 'tag',
			                    markerColor: colors[resData[i].type] || 'green'
							},
							layer: resData[i].type !== undefined ? resData[i].type : 'poi' 
						});

				var addedOverlays = ['poi', 'city', 'user', 'shopping-cart'];

				for (var i=0; i<addedOverlays.length;i++) {
					var foundMatch = false;
					angular.forEach($scope.markers, function(value, key) {
						if (addedOverlays[i] == value.layer && (foundMatch == false)) {
							$scope.layers.overlays[value.layer] = {
								name: value.layer,
								type: 'group', 
								visible: true
							}
							foundMatch = true;
						}
					});
				}

				// initialize Fuse with the index
				fuse = new Fuse($scope.markers, options)
			}
			
		});
	}

	var loadPaths = function(mapName) {
		MongoURLService.getPaths(mapName).then(function(response){
			console.log('GetPaths: (',mapName,')',response);
			if (angular.isDefined(response.data[0])) {

				for (var i=0;i<response.data.length;i++) {
					var resData = response.data[i];
					var key = 'path'+i;
					$scope.paths[key] = {
						color: resData.color,
						pathName: resData.pathName,
						weight: 5,
						latlngs: resData.coords,
						bubblingMouseEvents: false,
						layer: key,
						message: resData.pathName
					} 

					$scope.layers.overlays[key] = {
						name: resData.pathName,
						type: 'group',
						visible: resData.default == true ? true : false
					}
				}
			}
			
		});
	}

	var loadPlants = function() {
		MongoURLService.getPlants().then(function(response){
			console.log('GetPlants:', response);
			if (angular.isDefined(response.data)) 
				IngredientsService.setIngredients(response.data);	
		});
	}
	
	var loadPotions = function() {
		MongoURLService.getPotions().then(function(response){
			console.log('GetPotions:', response);
			if (angular.isDefined(response.data)) 
				IngredientsService.setPotions(response.data);	
		});
	}

	function readjustMap(event, thing) {
		$scope.mapName = thing.leafletEvent.name;

		var nameIdx = thing.leafletEvent.layer.options.mongo.name;

		$scope.center = $scope.layers.baselayers[nameIdx].layerOptions.mongo.center;
		$scope.maxBounds = $scope.layers.baselayers[nameIdx].layerOptions.mongo.maxBounds;

		$scope.layers.overlays = {};
		$scope.markers = {};
		$scope.paths = {};

		loadPaths(nameIdx);
		loadMarkers(nameIdx);
	}

	// Map Events
	$scope.$on('leafletDirectiveMap.map.baselayerchange', function(ev, layer) {
		readjustMap(ev, layer);
    });

	$scope.$on('leafletDirectiveMap.map.click', function(event, layer){
		// if (!godMode) {
			console.log('{"lat":'+layer.leafletEvent.latlng.lat.toFixed(3)+', "lng":'+layer.leafletEvent.latlng.lng.toFixed(3)+'}');
			// return;
		// }
		var markerName = prompt("Marker Name?", "Enter marker name here, e.g. Waterdeep");

		// Don't proceed if no marker name
		if (!markerName) {
			return;
		}

		var marker = {
			lat: layer.leafletEvent.latlng.lat,
			lng: layer.leafletEvent.latlng.lng,
			unverified: true,
			message: markerName,
			icon: {
				type: 'awesomeMarker',
				prefix: 'fa',
				icon: 'poi',
				markerColor: 'blue'
			},
			layer: 'poi' 
		}

		// Push dummy marker to the map
		$scope.markers.push(marker);

		// Identify the number of unverified markers to show on the view
		$scope.unverified = getUnverifiedMarkers().length;
    });

	// Path Events (mouse over and mouse out)
	$scope.$on('leafletDirectivePath.map.mouseover', function(event, layer){
		// find scope path object and change it's color and weight when clicked
		var pathClicked = layer.leafletEvent.target.options.layer;

		// Change Path color and weight while hovering
		$scope.paths[pathClicked].weight = 8;
	})

	$scope.$on('leafletDirectivePath.map.mouseout', function(event, layer){
		// find scope path object and change it's color and weight when clicked
		var pathClicked = layer.leafletEvent.target.options.layer;

		// Change Path weight while hovering
		$scope.paths[pathClicked].weight = 5;
	})

	loadMaps();

}]);