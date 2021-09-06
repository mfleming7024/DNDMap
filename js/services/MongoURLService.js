'use strict';

angular.module('myApp')
.service('MongoURLService', function($http, $q){

	this.getMaps = function(mapName) {
		var def = $q.defer();

		$http.get('http://142.93.15.233/mongo/getMaps/')
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to get maps");
	        });

        return def.promise;
	};

	this.getPaths = function(mapName) {
		var def = $q.defer();

		$http.get('http://142.93.15.233/mongo/getPaths/'+mapName)
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to get paths");
	        });

        return def.promise;
	}

	this.getMarkers = function(mapName) {
		var def = $q.defer();

		$http.get('http://142.93.15.233/mongo/getPoints/'+mapName)
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to get markers");
	        });

        return def.promise;
	}

	this.getPotions = function() {
		var def = $q.defer();

		$http.get('http://142.93.15.233/mongo/getPotions/')
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to get potions");
	        });

        return def.promise;
	}

	this.getPlants = function() {
		var def = $q.defer();

		$http.get('http://142.93.15.233/mongo/getPlants/')
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to get plants");
	        });

        return def.promise;
	}

	this.incrementPlant = function(plant) {
		var def = $q.defer();

		$http.put('http://142.93.15.233/mongo/addPlant/'+plant)
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to increment "+plant);
	        });

        return def.promise;
	}

	this.harvestPlant = function(plant, amount) {
		var def = $q.defer();

		$http.put('http://142.93.15.233/mongo/harvestPlant/'+plant+'/'+amount)
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to harvest ", plant, " ", amount, " times.");
	        });

        return def.promise;
	}

	this.addDay = function() {
		var def = $q.defer();

		$http.put('http://142.93.15.233/mongo/addDay/')
			.then(function(data) {
	            def.resolve(data);
	        },function(error){
	        	def.reject("Failed to add day");
	        });

        return def.promise;
	}

});