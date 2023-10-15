'use strict';

angular.module('myApp')
	.service('MongoURLService', function ($http, $q) {

		this.getMaps = function (mapName) {
			var def = $q.defer();

			$http.get('http://www.mikelmaps.com/mongo/getMaps/')
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to get maps");
				});

			return def.promise;
		};

		this.getPaths = function (mapName) {
			var def = $q.defer();

			$http.get('http://www.mikelmaps.com/mongo/getPaths/' + mapName)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to get paths");
				});

			return def.promise;
		}

		this.getMarkers = function (mapName) {
			var def = $q.defer();

			$http.get('http://www.mikelmaps.com/mongo/getPoints/' + mapName)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to get markers");
				});

			return def.promise;
		}

		this.getPotions = function () {
			var def = $q.defer();

			$http.get('http://www.mikelmaps.com/mongo/getPotions/')
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to get potions");
				});

			return def.promise;
		}

		this.getPlants = function () {
			var def = $q.defer();

			$http.get('http://www.mikelmaps.com/mongo/getPlants/')
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to get plants");
				});

			return def.promise;
		}

		this.incrementPlant = function (plant) {
			var def = $q.defer();

			$http.post('http://www.mikelmaps.com/mongo/addPlant/' + plant)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to increment " + plant);
				});

			return def.promise;
		}

		this.harvestPlant = function (plant, amount) {
			var def = $q.defer();

			$http.post('http://www.mikelmaps.com/mongo/harvestPlant/' + plant + '/' + amount)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to harvest ", plant, " ", amount, " times.");
				});

			return def.promise;
		}

		this.addPoint = function (mapName, pointName, lat, lng) {
			var def = $q.defer();

			$http.post('http://www.mikelmaps.com/mongo/addPoint/' + mapName + '/' + pointName + '/' + lat + '/' + lng)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to add ", pointName, " to ", mapName, ".");
				});

			return def.promise;
		}

		//update point
		this.updatePoint = function (mapName, pointName, lat, lng) {
			var def = $q.defer();

			$http.post('http://www.mikelmaps.com/mongo/updatePoint/' + mapName + '/' + pointName + '/' + lat + '/' + lng)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to update ", pointName, " in ", mapName, ".");
				});

			return def.promise;
		}

		//update path
		this.updatePathPoint = function (mapName, pathName, coordIndex, newLat, newLng) {
			var def = $q.defer();

			$http.post('http://www.mikelmaps.com/mongo/updatePathPoint/' + mapName + '/' + pathName + '/' + coordIndex + '/' + newLat + '/' + newLng)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to update ", pathName, " point in ", mapName, ".");
				});

			return def.promise;
		}

		this.addDay = function () {
			var def = $q.defer();

			$http.post('http://www.mikelmaps.com/mongo/addDay/')
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to add day");
				});

			return def.promise;
		}

		this.askBard = function (bardPrompt) {
			var def = $q.defer();

			$http.post('http://www.mikelmaps.com/mongo/askBard/' + bardPrompt)
				.then(function (data) {
					def.resolve(data);
				}, function (error) {
					def.reject("Failed to ask bard");
				});

			return def.promise;
		}

	});