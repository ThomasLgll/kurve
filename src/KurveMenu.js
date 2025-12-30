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

Kurve.Menu = {
    
    boundOnKeyDown: null,
    audioPlayer: null,
    scrollKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Spacebar', ' '],
    selectedKeyToModify: null,
    
    init: function() {
        this.initPlayerMenu();
        this.addWindowListeners();
        this.addMouseListeners();
        this.initMenuMusic();
    },
        
    initPlayerMenu: function() {
        var playerHTML = '';
        
        Kurve.players.forEach(function(player) {
            playerHTML += player.renderMenuItem();
        });
        
        document.getElementById('menu-players-list').innerHTML += playerHTML;
    },
    
    addWindowListeners: function() {
        this.boundOnKeyDown = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.boundOnKeyDown, false);
    },

    addMouseListeners: function() {
        var playerItems = document.getElementById('menu-players-list').children;

        for (var i=0; i < playerItems.length; i++) {
            playerItems[i].addEventListener('click', this.onPlayerItemClicked, false);
        }
    },

    initMenuMusic: function() {
        this.audioPlayer = Kurve.Sound.getAudioPlayer();
        this.audioPlayer.play('menu-music', {loop: true, background: true, fade: 2000, volume: 1});
    },
    
    removeWindowListeners: function() {
        window.removeEventListener('keydown', this.boundOnKeyDown, false);  
    },

    onPlayerItemClicked: function(event) {
        Kurve.Menu.audioPlayer.play('menu-navigate');
        Kurve.Menu.selectedPlayerId = this.id;
        Kurve.Menu.togglePlayerActivation(this.id);
    },

    setSelectedKeyToModify: function(playerId, key) {
        Kurve.players.forEach(function(player) {
            u.removeClass('key-active', player.getId() + "-key-left");
            u.removeClass('key-active', player.getId() + "-key-right");
            u.removeClass('key-active', player.getId() + "-key-superpower");
            u.addClass('key-inactive', player.getId() + "-key-left");
            u.addClass('key-inactive', player.getId() + "-key-right");
            u.addClass('key-inactive', player.getId() + "-key-superpower");
        })

        if (playerId && key) {
            this.selectedKeyToModify = {
                playerId,
                key,
            }
            Kurve.Menu.activatePlayer(playerId);

            u.removeClass('key-inactive', playerId + "-key-" + key);
            u.addClass('key-active', playerId + "-key-" + key);
        } else {
            this.selectedKeyToModify = null
        }
    },

    selectNextKeyToModify: function() {
        if (this.selectedKeyToModify) {
            const player = Kurve.getPlayer(this.selectedKeyToModify.playerId)
            const nextKey = player.getNextRequiredKey()
            console.log("nextKey", player.getId(), nextKey);
            if (nextKey) {
                return this.setSelectedKeyToModify(player.getId(), nextKey);
            } else {
                const nextPlayer = Kurve.getNextPlayer(player.getId())

                if (nextPlayer) {
                    const nextKey = nextPlayer.getNextRequiredKey()

                    if (nextKey) {
                        return this.setSelectedKeyToModify(nextPlayer.getId(), nextKey);
                    }
                }
            }

        }
        this.setSelectedKeyToModify(null, null)
    },


    
    onKeyDown: function(event) {
        if (event.metaKey) {
            return; //Command or Ctrl pressed
        }

        if (Kurve.Menu.scrollKeys.indexOf(event.key) >= 0) {
            event.preventDefault(); //prevent page scrolling
        }

        if (event.keyCode === 32) {
            Kurve.Menu.onSpaceDown();
        }


        let unableKeys = []
        const selectedKeyToModify = this.selectedKeyToModify;
        Kurve.players.forEach(function(player) {
            let exceptKey = null
            if (
                selectedKeyToModify
                && selectedKeyToModify.playerId === player.id
            ) {
                exceptKey = selectedKeyToModify.key
            }
            unableKeys = [...unableKeys, ...player.getUnableKeys(exceptKey)]
        })
        const uniqueUnableKeys = new Set(unableKeys);

        console.log(event.keyCode, uniqueUnableKeys);
        console.log(this.selectedKeyToModify);
        if (selectedKeyToModify) {
            if(!uniqueUnableKeys.has(event.keyCode)) {
                const player = Kurve.getPlayer(selectedKeyToModify.playerId)
                player.setKey(selectedKeyToModify.key, event.keyCode)
                this.selectNextKeyToModify();
                let modifiedDiv = document.getElementById(selectedKeyToModify.playerId + "-key-" + selectedKeyToModify.key)
                modifiedDiv.innerHTML = "<div>" + player.getKeyChar(selectedKeyToModify.key) + "</div>";
            } else {
                Kurve.Menu.audioPlayer.play('menu-error', {reset: true});

                u.addClass('shake', 'menu');

                setTimeout(function() {
                    u.removeClass('shake', 'menu');
                }, 450); //see Sass shake animation in _mixins.scss
            }
        }
    },
    
    onSpaceDown: function() {
        let areKeysSet = true
        Kurve.players.forEach(function(player) {
            if ( player.isActive() ) {
                if (player.areKeysSet() ) {
                    Kurve.Game.curves.push(
                        new Kurve.Curve(player, Kurve.Game, Kurve.Field, Kurve.Config.Curve, Kurve.Sound.getAudioPlayer())
                    );
                } else {
                    areKeysSet = false
                }
            }
        });
        
        if (Kurve.Game.curves.length <= 1 || !areKeysSet) {
            Kurve.Game.curves = [];
            Kurve.Menu.audioPlayer.play('menu-error', {reset: true});

            u.addClass('shake', 'menu');

            setTimeout(function() {
                u.removeClass('shake', 'menu');
            }, 450); //see Sass shake animation in _mixins.scss

            return; //not enough players are ready
        }

        Kurve.Field.init();
        Kurve.Menu.audioPlayer.pause('menu-music', {fade: 1000});
        Kurve.Game.startGame();

        u.addClass('hidden', 'layer-menu');
        u.removeClass('hidden', 'layer-game');
    },

    onNextSuperPowerClicked: function(event, playerId) {
        event.stopPropagation();
        Kurve.Menu.audioPlayer.play('menu-navigate');
        Kurve.Menu.nextSuperpower(playerId);
    },

    onPreviousSuperPowerClicked: function(event, playerId) {
        event.stopPropagation();
        Kurve.Menu.audioPlayer.play('menu-navigate');
        Kurve.Menu.previousSuperpower(playerId);
    },

    nextSuperpower: function(playerId) {
        var player = Kurve.getPlayer(playerId);
        var count = 0;
        var superpowerType = '';

        for (var i in Kurve.Superpowerconfig.types) {
            count++;
            if ( !(Kurve.Superpowerconfig.types[i] === player.getSuperpower().getType() ) ) continue;

            if ( Object.keys(Kurve.Superpowerconfig.types).length === count) {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[0];
            } else {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[count];
            }

            break;
        }

        player.setSuperpower( Kurve.Factory.getSuperpower(superpowerType) );
    },

    previousSuperpower: function(playerId) {
        var player = Kurve.getPlayer(playerId);
        var count = 0;
        var superpowerType = '';

        for (var i in Kurve.Superpowerconfig.types) {
            count++;
            if ( !(Kurve.Superpowerconfig.types[i] === player.getSuperpower().getType() ) ) continue;

            if ( 1 === count) {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[Object.keys(Kurve.Superpowerconfig.types).length - 1];
            } else {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[count - 2];
            }

            break;
        }

        player.setSuperpower( Kurve.Factory.getSuperpower(superpowerType) );
    },

    activatePlayer: function(playerId) {
        if ( Kurve.getPlayer(playerId).isActive() ) return;

        Kurve.getPlayer(playerId).setIsActive(true);

        u.removeClass('inactive', playerId);
        u.addClass('active', playerId);
    },

    deactivatePlayer: function(playerId) {
        if ( !Kurve.getPlayer(playerId).isActive() ) return;

        Kurve.getPlayer(playerId).setIsActive(false);

        u.removeClass('active', playerId);
        u.addClass('inactive', playerId);

        Kurve.Menu.setSelectedKeyToModify(null, null);
    },

    togglePlayerActivation: function(playerId) {
        if ( Kurve.getPlayer(playerId).isActive() ) {
            Kurve.Menu.deactivatePlayer(playerId);
        } else {
            Kurve.Menu.activatePlayer(playerId);
            const nextKey = Kurve.getPlayer(playerId).getNextRequiredKey()
            Kurve.Menu.setSelectedKeyToModify(playerId, nextKey ?? "left");
        }
    },

    requestFullScreen: function() {
        document.body.webkitRequestFullScreen();
    },
};
