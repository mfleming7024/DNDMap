angular.module('myApp')
.controller('potionController', ['$scope', 'MongoURLService', 'IngredientsService', function($scope, MongoURLService, IngredientsService) {
    
	var loadPotionJSON = function() {
        $scope.potions = IngredientsService.getPotions();
        $scope.ingredients = IngredientsService.getIngredients();
        $scope.harvestedIngredients = IngredientsService.getHarvestedIngredients();
	}

    // Delimiters:
    // '/': stands for "or"
    // '&': stands for "and"
    var findDelimiter = function(string) {
        if (string.indexOf('&') !== -1) {
            return 'and';
        } else if (string.indexOf('/') !== -1) {
            return 'or';
        } else {
            return 'none';
        }
    }

    var mapPotionIngsToPotions = function() {
        // Need to generate array or potion requirements to check against later
        $scope.potions.forEach(potion => {
            let mainIngRef = potion.main.split(',');
            let secIngRef = potion.secondary.split(',');
            let mainIngList = "";
            let secondaryIngList = "";

            // Quantity is first array index, ingredients second array index
            if (mainIngRef[1].indexOf('/') !== -1) {
                mainIngList = mainIngRef[1].split('/');
            } else if (mainIngRef[1].indexOf('&') !== -1) {
                mainIngList = mainIngRef[1].split('&');
            } else {
                mainIngList = mainIngRef[1];
            }

            // Quantity is first array index, ingredients second array index
            if (secIngRef[1].indexOf('/') !== -1) {
                secondaryIngList = secIngRef[1].split('/');
            } else if (secIngRef[1].indexOf('&') !== -1) {
                secondaryIngList = secIngRef[1].split('&');
            } else {
                secondaryIngList = secIngRef[1];
            }

            let mainReqs = {
                qty: mainIngRef[0],
                delimitter: findDelimiter(potion.main),
                components: mainIngList
            }

            let secReqs = {
                qty: secIngRef[0],
                delimitter: findDelimiter(potion.secondary),
                components: secondaryIngList
            }

            // Set is craftable for smokebomb only
            if (potion.name == "Potion of Healing") {
                potion.isCraftable = parseIngs(mainReqs) && parseIngs(secReqs) ? true : false;
            } else {
                potion.isCraftable = parseIngs(mainReqs) && parseIngs(secReqs) ? true : false;
            }

        });
    }


    // Checks ings and runs through validation if needed.
    function parseIngs(ings) {  
        // Array use case
        if (Array.isArray(ings.components)) {
            switch (ings.delimitter) {
                // check for qty of both
                case "and":
                    var canCraft = true;
                    for (var i=0; i<ings.components.length; i++) {
                        // Once false we need to bomb out of the loop and return false
                        if (!canCraft) {
                            return false;
                        } else {
                            canCraft = checkHarvestedQty(ings.components[i], ings.qty);
                        }
                    }
                    return canCraft;
                // Check for qty one or the other
                case "or":
                    var canCraft = false;
                    for (var i=0; i<ings.components.length; i++) {
                        if (canCraft) {
                            return true;
                        } else {
                            canCraft = checkHarvestedQty(ings.components[i], ings.qty);
                        }
                    }
                    return canCraft;
                default:
                    console.log('Ingredients delimitter not specified, failing');
            }
        } else {
            return checkHarvestedQty(ings.components, ings.qty);
        }
    }

    // Checks through harvested ingredients to see if we have enough for the potion
    function checkHarvestedQty(ingName, ingQty) {
        var harvestedIng = $scope.harvestedIngredients.filter(function(item){
            return item.name == ingName;
        });

        // Ingredient not Harvested
        if (!harvestedIng.length) {
            console.log(ingName, 'not harvested.');
            return false;
        }

        // Do we have enough quantity harvested?
        if (harvestedIng[0].inv_quantity >= ingQty) {
            return true;
        } else {
            console.log(ingName, ': ', ingQty, ' needed, ', harvestedIng[0].inv_quantity, ' harvested.');
            return false;
        }
    }

	loadPotionJSON();
    mapPotionIngsToPotions();

}]);