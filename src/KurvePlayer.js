/**
 *
 * Program:     Kurve
 * Author:      Markus Mächler, marmaechler@gmail.com
 * License:     http://www.gnu.org/licenses/gpl.txt
 * Link:        http://achtungkurve.com
 *
 * Copyright © 2014, 2015 Markus Mächler
 *
 * Kurve is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kurve is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kurve.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

'use strict';

Kurve.Player = function(id) {
    var points = 0;
    var superpower = Kurve.Factory.getSuperpower(Kurve.Superpowerconfig.types.NO_SUPERPOWER);
    var superPowerElement = null;
    var isActive = false;
    var color = null;

    var keys = {
        "left": null,
        "right": null,
        "superpower": null,
    }

    const storedKeys = localStorage.getItem(id + "-keys")
    if (storedKeys) {
        keys = JSON.parse(storedKeys)
        console.log(keys);
        Object.keys(keys).forEach(key => {
            if (keys[key] === "null" || keys[key] === "" || keys[key] === " ") {
                keys[key] = null
            }
        })
    }
    
    this.incrementPoints = function() {
        points++;
    };

    this.setSuperpower = function(newSuperpower) {
        superpower = newSuperpower;

        if ( superPowerElement === null ) {
            superPowerElement = document.getElementById(this.getId() + '-superpower');
        }

        superPowerElement.innerHTML = this.getSuperpower().getLabel();
    };

    this.setColor = function(newColor) { color = newColor; };
    this.setIsActive = function(newIsActive) { isActive = newIsActive; };
    
    this.getPoints = function() { return points; };
    this.getId = function() { return id; };
    this.getColor = function() { return color === null ? Kurve.Theming.getThemedValue('players', id) : color };
    this.getSuperpower = function() { return superpower; };
    this.getKeyLeft = function() { return keys.left };
    this.getKeyRight = function() { return keys.right };
    this.getKeySuperpower = function() { return keys.superpower };
    this.isActive = function() { return isActive; };

    this.getUnableKeys = function (exceptKey) {
        let unableKeys = []
        Object.entries(keys).forEach(function([key, value]) {
            if (exceptKey !== key) {
                unableKeys.push(value)
            }
        })
        return unableKeys
    }

    this.setKey = function(key, value) {
        keys[key] = value;
        localStorage.setItem(id + "-keys", JSON.stringify(keys));
    }

    this.getKey = function(key) {
        return keys[key]
    }

    this.areKeysSet = function() {
        return Object.values(keys).every(value => value !== null)
    }

    this.getNextRequiredKey = function() {
        const nullableKeyFound = Object.entries(keys).find(([key, value]) => value === null)
        if (nullableKeyFound) {
            return nullableKeyFound[0]
        } else {
            return null
        }

    }


};

function handleSelectedKeyToModify(event, playerId, key) {
    event.stopPropagation();
    console.log("CLICKED")
    Kurve.Menu.setSelectedKeyToModify(playerId, key)
}

Kurve.Player.prototype.renderMenuItem = function() {
    return  '<div id="' + this.getId() + '" class="player inactive ' + this.getId() +'">' +
                '<div class="title light"><h2>' + this.getId() + '</h2></div>' +
                '<div id="' + this.getId() + '-key-left" class="key left light key-inactive" onclick="handleSelectedKeyToModify(event, \'' + this.getId() + '\', `left`)"><div>' + this.getKeyLeftChar() + '</div></div>' +
                '<div id="' + this.getId() + '-key-right" class="key right light key-inactive" onclick="handleSelectedKeyToModify(event, \'' + this.getId() + '\', `right`)"><div>' + this.getKeyRightChar() + '</div></div>' +
                '<div class="superpower">' +
                    '<div id="' + this.getId() + '-key-superpower" class="key light key-inactive" onclick="handleSelectedKeyToModify(event, \'' + this.getId() + '\', `superpower`)">' + this.getKeySuperpowerChar() + '</div>' +
                    '<div class="superpowerType light">' +
                        '<div class="left" onclick="Kurve.Menu.onPreviousSuperPowerClicked(event, \'' + this.getId() + '\')"><i class="arrow arrow-left"></i></div>' +
                        '<div class="superpowers">' +
                            '<div id="' + this.getId() + '-superpower">' + this.getSuperpower().getLabel() + '</div>' +
                        '</div> ' +
                        '<div class="right" onclick="Kurve.Menu.onNextSuperPowerClicked(event, \'' + this.getId() + '\')"><i class="arrow arrow-right"></i></div>' +
                    '</div> ' +
                '</div>' +
                '<div class="clear"></div>' +
            '</div>';
};

Kurve.Player.prototype.renderScoreItem = function() {
    return  '<div class="active ' + this.getId() + '">' +
                '<div class="title"><h2>' + this.getId() + '</h2></div>' +
                '<div class="points">' + this.getPoints() + '</div>' +
                '<div class="clear"></div>' +
                '<div class="superpowers">' +
                    this.renderNumberOfSuperPowers() +
                    '<span class="superpower-label">' + this.getSuperpower().getLabel() + '</span>' +
                '</div>' +
            '</div>';
};

Kurve.Player.prototype.renderNumberOfSuperPowers = function() {
    var superpowers = '';

    for (var i=0; i < Kurve.Config.Superpower.maxSuperpowers; i++ ) {
        superpowers += '<div class="superpowerCircle' + (i < this.getSuperpower().getCount() ? ' ' + this.getId() : '') + '"></div>';
    }

    return superpowers;
};

Kurve.Player.prototype.isKeyRight = function(keyCode) {
    return this.getKeyRight() === keyCode;
};
    
Kurve.Player.prototype.isKeyLeft = function(keyCode) {
    return this.getKeyLeft() === keyCode;
};

Kurve.Player.prototype.isKeySuperpower = function(keyCode) {
    return this.getKeySuperpower() === keyCode;
};

Kurve.Player.prototype.getKeyLeftChar = function() {
    if ( this.isNullKey(this.getKeyLeft())) return "?"
    if ( this.isArrowKey(this.getKeyLeft()) ) return this.arrowKeyChar(this.getKeyLeft());

    return String.fromCharCode(this.getKeyLeft());
};

Kurve.Player.prototype.getKeyRightChar = function() {
    if ( this.isNullKey(this.getKeyLeft())) return "?"
    if ( this.isArrowKey(this.getKeyRight()) ) return this.arrowKeyChar(this.getKeyRight());

    return String.fromCharCode(this.getKeyRight());
};

Kurve.Player.prototype.getKeySuperpowerChar = function() {
    if ( this.isNullKey(this.getKeyLeft())) return "?"
    if ( this.isArrowKey(this.getKeySuperpower()) ) return this.arrowKeyChar(this.getKeySuperpower());

    return String.fromCharCode(this.getKeySuperpower());
};

Kurve.Player.prototype.getKeyChar = function(key) {
    if ( this.isNullKey(this.getKey(key))) return "?"
    if ( this.isArrowKey(this.getKey(key)) ) return this.arrowKeyChar(this.getKey(key));

    return String.fromCharCode(this.getKey(key));
}

Kurve.Player.prototype.isArrowKey = function(keyCode) {
    return keyCode === 37 || keyCode === 39 || keyCode === 40;
};

Kurve.Player.prototype.isNullKey = function(keyCode) {
    return keyCode === null
}

Kurve.Player.prototype.arrowKeyChar = function(keyCode) {
    switch (keyCode) {
        case 37:
            return '<span class="arrow arrow-left"></span>';
            break;
        case 39:
            return '<span class="arrow arrow-right"></span>';
            break;
        case 40:
            return '<span class="arrow arrow-down"></span>';
            break;
        default:
            return '';
    }
};
