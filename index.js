'use strict'
const fs = require('fs');
const path = require("path");

module.exports = function AutoWine(mod) {
    const { command } = mod;

    let enabled = false;

    const redwine = 80062;
    const whitewine = 80063;

    const redwine_abn = 70258;
    const whitewine_abn = 70259;

    const physicals = [0, 1, 2, 3, 5, 10, 12];
    const magicals = [4, 6, 7, 8, 9, 11];

    let zones = [];

    let aZone = 0;
    let alive = true;
    let phys = false;
    let mag = false;
    let gameId;
    let model;
    let job;
    let drunk;

    let myAngle;
    let myPosition;

    let config_file = require('./config.json');
    updateConfig();
    
    command.add('wine', {
        '$default'() {
            enabled = !enabled;
                command.message(`${enabled ? "enabled" : "disabled"}`);
        },
        'add'() {
            if(!config_file["zones"].includes(aZone)) zones.push(aZone);
            config_file["zones"] = zones;
            fs.writeFileSync(path.join(__dirname, "config.json"), JSON.stringify(config_file, null, 2));
		},
        'remove'() {
            let i = zones.indexOf(aZone);
            if (i > -1) {
                zones.splice(i, 1);
            }
            config_file["zones"] = zones;
            fs.writeFileSync(path.join(__dirname, "config.json"), JSON.stringify(config_file, null, 2));
        }
    })

    mod.hook('S_LOAD_TOPO', 3, (event) => {
		aZone = event.zone;
	})

    mod.hook('C_PLAYER_LOCATION', 5, (event) => {
		myPosition = event.loc;
		myAngle = event.w;
	});

    mod.hook('S_PLAYER_STAT_UPDATE', 17, (event) => {
        if(!enabled) return;
        alive = event.alive;
        if(event.status == 1 && event.alive && !drunk && zones.includes(aZone)){
            if(phys){
                mod.send('C_USE_ITEM', 3, {  
                    gameId: gameId,
                    id: redwine,
                    dbid: 0n,
                    target: 0n,
                    amount: 1,
                    dest: { x: 0, y: 0, z: 0 },
                    loc: myPosition,
                    w: myAngle,
                    unk1: 0,
                    unk2: 0,
                    unk3: 0,
                    unk4: true
                });
            }else if(mag){
                mod.send('C_USE_ITEM', 3, {  
                    gameId: gameId,
                    id: whitewine,
                    dbid: 0n,
                    target: 0n,
                    amount: 1,
                    dest: { x: 0, y: 0, z: 0 },
                    loc: myPosition,
                    w: myAngle,
                    unk1: 0,
                    unk2: 0,
                    unk3: 0,
                    unk4: true
                });
            }
        }
    })

    mod.hook('S_LOGIN', mod.majorPatchVersion >= 81 ? 14 : 13, (event) => {
        enabled = true;
        gameId = event.gameId;
        model = event.templateId;
        job = (model - 10101) % 100;
        if(physicals.includes(job)){
            phys = true;
            mag = false;
        }
        else if(magicals.includes(job)){
            phys = false;
            mag = true;
        }
    })

    mod.hook('S_ABNORMALITY_BEGIN', 5, (event) => {
        if ((event.id === redwine_abn || event.id === whitewine_abn) && gameId === event.target) {
            drunk = true;
        }
    })

    mod.hook('S_ABNORMALITY_REFRESH', 2, (event) => {
        if ((event.id === redwine_abn || event.id === whitewine_abn) && gameId === event.target) {
            drunk = true;
        }
    })

    mod.hook('S_ABNORMALITY_END', 1, (event) => {
        if ((event.id === redwine_abn || event.id === whitewine_abn) && gameId === event.target) {
            drunk = false;
        }
    })

    async function updateConfig(){
        zones = config_file["zones"];
    }
}