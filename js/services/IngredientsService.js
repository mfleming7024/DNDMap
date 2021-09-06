'use strict';

angular.module('myApp')
.service('IngredientsService', function(){

    this.setPotions = function(passedPotions) {
        this.potions = passedPotions;
    }

    this.getPotions = function() {
        return this.potions;
    }

    this.setIngredients = function(passedIngredients) {
        this.ingredients = passedIngredients
    }

	this.getIngredients = function() {
        return this.ingredients;
	};

    this.getHarvestedIngredients = function() {
        return this.ingredients.filter(function(item){
            return item.inv_quantity > 0;
        });
    }

});