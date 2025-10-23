'use strict';

angular.module('myApp')
	.controller('mainController', ['$scope', 'MongoURLService', 'IngredientsService', 'leafletData', '$sce', function ($scope, MongoURLService, IngredientsService, leafletData, $sce) {

		// $scope Properties
		angular.extend($scope, {
			defaults: { crs: 'Simple' },
			center: {},
			maxBounds: {
				northEast: {},
				southWest: {}
			},
			paths: {},
			markers: [],
			layers: {
				baselayers: {},
				overlays: {}
			},
			events: {
				map: {
					enable: ['click', 'baselayerchange', 'contextmenu'],
					logic: 'emit'
				},
				marker: {
					enable: ['click', 'dragend', 'contextmenu'],
					logic: 'emit'
				},
				path: {
					enable: ['click', 'mouseover', 'mouseout', 'contextmenu'],
					logic: 'emit'
				}
			},
			displaySearchModal: false
		});

		// Fuse.js Indexing Options
		var fuseOptions = {
			keys: ['message'],
			includeScore: true
		};
		var fuse;

		// $scope Methods
		$scope.toggleSearchModal = function () {
			$scope.searchThing = "";
			$scope.displaySearchModal = !$scope.displaySearchModal;
		};

		$scope.search = function (thing) {
			$scope.results = fuse.search(thing);
		};

		$scope.flyTo = function (latitude, longitude) {
			leafletData.getMap('map').then(function (mapRef) {
				$scope.toggleSearchModal();
				mapRef.flyTo({ lat: latitude, lng: longitude });
			});
		};

		var counter = 0;
		$scope.enableGodMode = function () {
			if ($scope.godMode) {
				return;
			} else if (counter > 1) {
				$scope.godMode = true;
			} else {
				counter++;
			}
		};

		$scope.toggleOverlay = function (overlayName) {
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
		};

		// Helper Functions
		function normalizeMapName(mapName) {
			return mapName.toLowerCase().replace(/\s+/g, '');
		}

		function findMarker(label) {
			return $scope.markers.filter(function (marker) { return marker.message == label; })[0];
		}

		// Internal Functions (Data Loading and Map Adjustments)
		var loadMarkers = function (mapName) {
			MongoURLService.getMarkers(mapName).then(function (response) {
				console.log('GetMarkers: (', mapName, ')', response);
				if (angular.isDefined(response.data) && response.data.length !== 0) {
					var resData = response.data;

					var colors = {
						poi: "red",
						city: "blue",
						user: "green",
						'shopping-cart': "yellow"
					};

					for (var i = 0; i < resData.length; ++i) {
						if (resData[i] !== undefined) {
							$scope.markers.push({
								lat: resData[i].coords.lat,
								lng: resData[i].coords.lng,
								message: resData[i].label,
								opacity: 1,
								icon: {
									type: 'awesomeMarker',
									prefix: 'fa',
									icon: resData[i].type ? resData[i].type !== 'poi' ? resData[i].type : 'tag' : 'tag',
									markerColor: colors[resData[i].type] || 'green'
								},
								layer: resData[i].type !== undefined ? resData[i].type : 'poi'
							});
						}
					}

					var addedOverlays = ['poi', 'city', 'user', 'shopping-cart'];

					for (var i = 0; i < addedOverlays.length; i++) {
						var foundMatch = false;
						angular.forEach($scope.markers, function (value, key) {
							if (addedOverlays[i] == value.layer && (foundMatch == false)) {
								$scope.layers.overlays[value.layer] = {
									name: value.layer,
									type: 'group',
									visible: true
								};
								foundMatch = true;
							}
						});
					}

					// initialize Fuse with the index
					fuse = new Fuse($scope.markers, fuseOptions);
				}

			});
		};

		var loadPaths = function (mapName) {
			MongoURLService.getPaths(mapName).then(function (response) {
				console.log('GetPaths: (', mapName, ')', response);
				if (angular.isDefined(response.data[0])) {

					for (var i = 0; i < response.data.length; i++) {
						var resData = response.data[i];
						var key = 'path' + i;
						$scope.paths[key] = {
							color: resData.color,
							pathName: resData.pathName,
							weight: 5,
							opacity: 0.6,
							latlngs: resData.coords,
							bubblingMouseEvents: false,
							layer: key,
							message: resData.pathName
						};

						$scope.layers.overlays[key] = {
							name: resData.pathName,
							type: 'group',
							visible: resData.default == true ? true : false
						};
					}
				}

			});
		};

		var loadPlants = function () {
			MongoURLService.getPlants().then(function (response) {
				console.log('GetPlants:', response);
				if (angular.isDefined(response.data))
					IngredientsService.setIngredients(response.data);
			});
		};

		var loadPotions = function () {
			MongoURLService.getPotions().then(function (response) {
				console.log('GetPotions:', response);
				if (angular.isDefined(response.data))
					IngredientsService.setPotions(response.data);
			});
		};

		function readjustMap(event, thing) {
			$scope.mapName = thing.leafletEvent.name;

			var nameIdx = thing.leafletEvent.layer.options.mongo.name;

			$scope.center = $scope.layers.baselayers[nameIdx].layerOptions.mongo.center;
			$scope.maxBounds = $scope.layers.baselayers[nameIdx].layerOptions.mongo.maxBounds;

			$scope.layers.overlays = {};
			$scope.markers = [];
			$scope.paths = {};

			loadPaths(nameIdx);
			loadMarkers(nameIdx);
		}

		var loadMaps = function () {
			MongoURLService.getMaps().then(function (results) {
				var resData = results.data;

				// Grab default map data and move it to the front of the list
				var defaultMap = resData.filter(function (map) {
					return map.mapName == "impiltur";
				});
				var defaultIndex = resData.indexOf(defaultMap[0]);

				resData.unshift(resData.splice(defaultIndex, 1)[0]);

				console.log('GetMaps:', results);
				for (var i = 0; i < resData.length; i++) {
					// ignore disabled maps
					if (resData[i].disabled) {
						continue;
					}

					$scope.layers.baselayers[resData[i].mapName] = {
						name: resData[i].mapActual,
						type: 'imageOverlay',
						url: "/" + resData[i].image,
						bounds: resData[i].bounds,
						layerParams: {
							noWrap: true,
							mongo: {
								name: resData[i].mapName,
								center: {
									lat: resData[i].mapCenter.lat,
									lng: resData[i].mapCenter.lng,
									zoom: resData[i].zoom
								},
								maxBounds: {
									northEast: { lat: resData[i].bounds[1][0], lng: resData[i].bounds[1][1] },
									southWest: { lat: 0, lng: 0 }
								}
							}

						}
					};
				}

				if (angular.isDefined($scope.deviceType) && $scope.deviceType == 'mobile') {
					// useMobile = true; // Commented out as useMobile is not defined in the provided code
				}

				$scope.center = {
					lat: defaultMap[0].mapCenter.lat,
					lng: defaultMap[0].mapCenter.lng,
					zoom: defaultMap[0].zoom,
				};

				$scope.maxBounds = {
					northEast: { lat: defaultMap[0].bounds[1][0], lng: defaultMap[0].bounds[1][1] },
					southWest: { lat: 0, lng: 0 }
				};

				$scope.mapName = defaultMap[0].mapActual;
				loadPaths(defaultMap[0].mapName);
				loadMarkers(defaultMap[0].mapName);
			});
			loadPlants();
			loadPotions();
		};


		// Event Listeners
		$scope.$on('leafletDirectiveMap.map.baselayerchange', function (ev, layer) {
			readjustMap(ev, layer);
		});

		$scope.$on('leafletDirectiveMap.map.click', function (event, layer) {
			if ($scope.godMode) {
				// TODO: Implement marker types via generic modal
				var markerName = prompt("Marker Name?", "Enter marker name here, e.g. Waterdeep");

				// Don't proceed if no marker name
				if (!markerName) {
					return;
				}

				var marker = {
					lat: layer.leafletEvent.latlng.lat,
					lng: layer.leafletEvent.latlng.lng,
					message: markerName,
					opacity: 1,
					icon: {
						type: 'awesomeMarker',
						prefix: 'fa',
						icon: 'city',
						markerColor: 'blue'
					},
					layer: 'city'
				};

				// Push dummy marker to the map
				$scope.markers.push(marker);

				var mapName = normalizeMapName($scope.mapName);

				// Push dummy marker to the database
				MongoURLService.addPoint(mapName, markerName, marker.lat, marker.lng).then(function (response) {
					console.log('AddMarker:', response);
				});
			} else {
				console.log('{"lat":' + layer.leafletEvent.latlng.lat.toFixed(3) + ', "lng":' + layer.leafletEvent.latlng.lng.toFixed(3) + '}');
			}
		});

		$scope.$on('leafletDirectiveMarker.map.mouseover', function (event, layer) {
			var hoveredMarker = findMarker(layer.model.message);
			if (hoveredMarker && hoveredMarker.icon) {
				hoveredMarker.icon.markerColor = 'purple';
			}
		});

		$scope.$on('leafletDirectiveMarker.map.mouseout', function (event, layer) {
			var hoveredMarker = findMarker(layer.model.message);
			if (hoveredMarker && hoveredMarker.icon) {
				hoveredMarker.icon.markerColor = 'blue'; // Or its original color if stored
			}
		});

		$scope.$on('leafletDirectiveMarker.map.contextmenu', function (event, layer) {
			if (!$scope.godMode) {
				return;
			}

			var markerLabel = layer.model.message;
			var mapName = normalizeMapName($scope.mapName);

			if (confirm("Do you want to delete the marker '" + markerLabel + "'? \\n\\nClick OK to Delete, or Cancel to make it movable.")) {
				var markerIndex = $scope.markers.findIndex(function(marker){ return marker.message === markerLabel; });

				if (markerIndex !== -1) {
					$scope.markers.splice(markerIndex, 1); // Remove from UI

					MongoURLService.deletePoint(mapName, markerLabel).then(function (response) {
						console.log('DeleteMarker:', markerLabel, response);
					});
				}
			} else {
				var matchingMarker = findMarker(markerLabel);
				if (matchingMarker) {
					matchingMarker.icon = {
						type: 'awesomeMarker',
						prefix: 'fa',
						icon: 'arrows',
						markerColor: 'red'
					};
					matchingMarker.draggable = true;
				}
			}
		});

		$scope.$on('leafletDirectiveMarker.map.dragstart', function (event, layer) {
			$scope.activeMarker = layer.model;
			$scope.activeMarker.oldLat = layer.model.lat;
			$scope.activeMarker.oldLng = layer.model.lng;
		});

		$scope.$on('leafletDirectiveMarker.map.dragend', function (event, layer) {
			if (!$scope.godMode) {
				return;
			}
			if ($scope.activePath) {
				var matchingLatLng = $scope.activePath.latlngs.find(function (latlng) { return latlng.lat == $scope.activeMarker.oldLat && latlng.lng == $scope.activeMarker.oldLng; });
				if(matchingLatLng){
					matchingLatLng.lat = layer.model.lat;
					matchingLatLng.lng = layer.model.lng;

					var newLat = layer.model.lat;
					var newLng = layer.model.lng;
					var pathName = $scope.activePath.pathName;
					var latIdx = $scope.activePath.latlngs.indexOf(matchingLatLng);

					MongoURLService.updatePathPoint(normalizeMapName($scope.mapName), pathName, latIdx, newLat, newLng).then(function (response) {
						console.log('UpdatePathPoint:', response);
					});
				}
			} else {
				var matchingMarker = findMarker(layer.model.message);

				if(matchingMarker){
					matchingMarker.icon = {
						type: 'awesomeMarker',
						prefix: 'fa',
						icon: 'poi',
						markerColor: 'blue'
					};
					matchingMarker.draggable = false;

					var newLat = layer.model.lat;
					var newLng = layer.model.lng;
					var markerName = layer.model.message;

					matchingMarker.lat = newLat;
					matchingMarker.lng = newLng;

					MongoURLService.updatePoint(normalizeMapName($scope.mapName), markerName, newLat, newLng).then(function (response) {
						console.log('UpdateMarker:', response);
					});
				}
			}
		});

		$scope.$on('leafletDirectivePath.map.mouseover', function (event, layer) {
			var pathClicked = layer.leafletEvent.target.options.layer;
			if($scope.paths[pathClicked]){
				$scope.paths[pathClicked].weight = 8;
			}
		});

		$scope.$on('leafletDirectivePath.map.mouseout', function (event, layer) {
			var pathClicked = layer.leafletEvent.target.options.layer;
			if($scope.paths[pathClicked]){
				$scope.paths[pathClicked].weight = 5;
			}
		});

		$scope.$on('leafletDirectivePath.map.contextmenu', function (event, layer) {
			if (!$scope.godMode) {
				return;
			}

			// Todo: need to swap all icons back to normal and set draggable to false
			if ($scope.activePath) {
				console.log('we have an active path already');
			} else {
				var pathClicked = layer.leafletEvent.target.options.layer;
				var scpRef = $scope.paths[pathClicked];
				if(scpRef){
					$scope.activePath = scpRef;

					scpRef.color = "purple";
					scpRef.opacity = 1;

					var pathCoords = scpRef.latlngs;
					var pathName = scpRef.message;

					for (var i = 0; i < pathCoords.length; i++) {
						var marker = {
							lat: pathCoords[i].lat,
							lng: pathCoords[i].lng,
							message: pathName,
							icon: {
								type: 'awesomeMarker',
								prefix: 'fa',
								icon: 'arrows',
								markerColor: 'red'
							},
							draggable: true,
							toBeRemoved: true,
							layer: 'poi'
						};
						$scope.markers.push(marker);
					}
				}
			}
		});

		// Initial Load
		loadMaps();

	}]);