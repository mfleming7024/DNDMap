'use strict';

angular.module('myApp')
.controller('mainController', ['$scope', 'MongoURLService', 'IngredientsService', function($scope, MongoURLService, IngredientsService) {

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
                enable: ['click','baselayerchange', 'contextmenu'],
                logic: 'emit'
            }
        }
	});

	$scope.$on('leafletDirectiveMap.map.click', function(event, layer){
        console.log('{"lat":'+layer.leafletEvent.latlng.lat.toFixed(3)+', "lng":'+layer.leafletEvent.latlng.lng.toFixed(3)+'}');
    });

    $scope.$on('leafletDirectiveMap.map.baselayerchange', function(ev, layer) {
		readjustMap(ev, layer);
    });

	// Search functionality
	// Have a stored list of all the map locations
	// Fuzzy search based off of that. 
	// Make mongo call to get that point, fly to the coords

	$scope.togglePotionLab = function() {
		if ($scope.godMode) {
			$scope.showPotionLab = !$scope.showPotionLab;
		} else {
			var answer = prompt("Are ye worthy?", "enter code");
			if (answer == "7024") {
				$scope.showPotionLab = !$scope.showPotionLab;
				$scope.godMode = true;
			}
		}
	}

	$scope.toggleGarden = function() {
		if ($scope.godMode) {
			$scope.showGarden = !$scope.showGarden;
		} else {
			var answer = prompt("Are ye worthy?", "enter code");
			if (answer == "7024") {
				$scope.showGarden = !$scope.showGarden;
				$scope.godMode = true;
			}
		}
		
	}

	$scope.loadMaps = function() {
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
			$scope.loadPaths(faerun[0].mapName);
			$scope.loadMarkers(faerun[0].mapName);
		});
		loadPlants();
		loadPotions();
	}

	$scope.loadMarkers = function(mapName) {
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

				for (var i = 0; i < resData.length; ++i)
					if (resData[i] !== undefined)
						$scope.markers[i] = {
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
						}

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

			}
			
		});
	}

	// TODO: Make this more dynamic than only supporting 'our journey'
	$scope.loadPaths = function(mapName) {
		MongoURLService.getPaths(mapName).then(function(response){
			console.log('GetPaths: (',mapName,')',response);
			if (angular.isDefined(response.data[0])) {

				for (var i=0;i<response.data.length;i++) {
					var resData = response.data[i];
					var key = 'path'+i;
					$scope.paths[key] = {
						color: resData.color,
						weight: 3,
						latlngs: resData.coords,
						layer: key
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

		$scope.loadPaths(nameIdx);
		$scope.loadMarkers(nameIdx);
	}

	$scope.loadMaps();

}]);