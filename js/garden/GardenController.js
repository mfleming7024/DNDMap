'use strict';

angular.module('myApp')
.controller('gardenController', ['$scope', 'MongoURLService', 'IngredientsService', function($scope, MongoURLService, IngredientsService) {

	$scope.loadPlantJSON = function() {
		$scope.plants = IngredientsService.getIngredients();
	}

	$scope.addPlant = function(plantName) {
		var answer = prompt('Did you mean to add an additional '+plantName+'? If so type "yes"');
		if (answer === "yes") 
			MongoURLService.incrementPlant(plantName).then(function(response){
				console.log('incrementPlant: (',plantName,')', response);
				if (response.status == 200) {
					$scope.plants.forEach(function(item){
						if (item.name == plantName)
							item.quantity++;
					})
				}
			});
	}

	$scope.harvestPlant = function(plantName, amount) {
		MongoURLService.harvestPlant(plantName, amount).then(function(response){
			console.log('HarvestPlant: (',plantName,amount,')', response);
			if (response.status == 200) {
				// set to zero visually and add quantity to the inventory
				$scope.plants.forEach(function(item){
					if (item.name == plantName) {
						console.log('match', item.name, plantName);
						item.inv_quantity += amount;
						item.timeToHarvest = 0;
					}
				})
			}
		});
	}

	$scope.addDay = function() {
		// add day to the db
		MongoURLService.addDay().then(function(response){
			console.log('AddDay: ', response);
			if (response.status == 200) {
				// add day visually
				$scope.plants.forEach(function(item){
					if (item.quantity > 0)
						item.timeToHarvest++;
				})
			}
		})
	}

	$scope.loadPlantJSON();

}]);