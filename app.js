import * as PIXIParticles from 'pixi-particles'
import * as TWEEN from '@tweenjs/tween.js'
import * as PIXI from 'pixi.js'
import car from './PNG/Car_1_Main_Positions/Car_1_01.png'
import grass from './PNG/Background_Tiles/Grass_Tile.png'
import police from './PNG/Car_2_Main_Positions/Car_2_01.png'
import water from './PNG/Background_Tiles/Water_Tile.png'
import soil from './PNG/Background_Tiles/Soil_Tile.png'
import bubble from './PNG/soap_bubbles_PNG37-min.png'
import emitJson from './emitter.json'

const loader = PIXI.Loader.shared,
    resources = loader.resources,
    Sprite = PIXI.Sprite,
    TextureCache = PIXI.utils.TextureCache
//

let app = new PIXI.Application({
    height: 450,
    width: 450,
    antialias: true,
    transparent: false,
    backgroundColor: 0x000fff,
    resolution: 1
})

app.renderer.backgroundColor = 0xf3ff00;
app.renderer.resize(window.innerWidth, window.innerHeight);


document.body.appendChild(app.view);

const sprites = {};
let state;

let gameOverStyle = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 72,
    fill: "white",
    stroke: '#ff3300',
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
});

let gameOverMessage = new PIXI.Text('GAME OVER', gameOverStyle);

loader
    .add([
        car,
        grass,
        police,
        water,
        soil,
        bubble
    ])
    .load(setup)
//

let emitter;
let elapsed = Date.now();

let mouseX = 100;
let mouseY = 100;
app.view.addEventListener('click', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    let emitterTween = new TWEEN.Tween(emitter.spawnPos)
        .to({x: mouseX, 
            y: mouseY}, 1000)
        // .onComplete(TWEEN.remove(emitterTween))
        .start();
    console.log(mouseX, mouseY);
    console.log(emitter.spawnPos);
})

function setup() {
    sprites.car = new Sprite(resources[car].texture);
    sprites.police = new Sprite(resources[police].texture);
    sprites.texture = new Sprite(resources[grass].texture);
    let someTexture = TextureCache[soil];
    let rectangle = new PIXI.Rectangle(395, 54, 42, 44);
    someTexture.frame = rectangle;
    sprites.thing = new Sprite(someTexture);

    sprites.texture.texture = TextureCache[water];
    sprites.car.scale.set(0.2);
    sprites.car.vx = 0;
    sprites.car.vy = 0;
    sprites.police.scale.set(0.2);
    sprites.texture.width = window.innerWidth;
    sprites.texture.height = window.innerHeight;
    sprites.police.position.set(250, 250);
    // sprites.police.anchor.set(0.5, 0.5);
    // police.pivot.set(300, 300);
    sprites.police.rotation = 0.5;

    sprites.thing.scale.set(1.2);
    sprites.thing.anchor.set(0.5);
    sprites.thing.position.set(400, 100);

    // let vehicles = new PIXI.ParticleContainer();
    // vehicles.position.set(100);
    // vehicles.addChild(sprites.car, sprites.police);
    app.stage.addChild(sprites.texture, sprites.thing, sprites.police, sprites.car);

    console.log(sprites.car.toLocal(sprites.car.position, sprites.police));

    let left = keyboard("ArrowLeft"),
        right = keyboard("ArrowRight"),
        up = keyboard("ArrowUp"),
        down = keyboard("ArrowDown");

    left.press = () => {
        sprites.car.vx = -1;
    };

    left.release = () => {
        if (!right.isDown) sprites.car.vx = 0;
    };

    right.press = () => {
        sprites.car.vx = 1;
    };

    right.release = () => {
        if (!left.isDown) sprites.car.vx = 0;
    };

    up.press = () => {
        sprites.car.vy = -1;
    };

    up.release = () => {
        if (!down.isDown) sprites.car.vy = 0;
    };

    down.press = () => {
        sprites.car.vy = 1;
    };

    down.release = () => {
        if (!up.isDown) sprites.car.vy = 0;
    };


    let policeTween = new TWEEN.Tween(sprites.police.position)
        .to({ x: '+800' }, 5000)
        .repeat(5)
        .yoyo(true)
        .easing(TWEEN.Easing.Bounce.InOut)
        .start();
    //

    emitter = new PIXIParticles.Emitter(app.stage,
        TextureCache[bubble],
        JSON.parse(JSON.stringify(emitJson))
    );
    // emitter.emit = true;
    
    state = play;

    app.ticker.add(delta => gameLoop(delta));
}

loader.onProgress.add((loader, resource) => {
    console.log(`Loading: ${resource.url}`);
    console.log(`Progress: ${loader.progress}%`);
})

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    sprites.car.y += sprites.car.vy;
    sprites.car.x += sprites.car.vx;

    TWEEN.update();

    let now = Date.now();
    emitter.update((now - elapsed) * 0.001);
    elapsed = now;

    if (hitTestRectangle(sprites.car, sprites.police) || hitTestRectangle(sprites.car, sprites.thing)) {
        sprites.car.position.set(0);
        gameOverMessage.position.set(app.stage.width / 2, app.stage.height / 2);
        app.stage.addChild(gameOverMessage);
    }
}


function keyboard(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.key === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.key === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key)
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key)
    );
    return key;
}

function hitTestRectangle(r1, r2) {

    //Define the variables we'll need to calculate
    let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //hit will determine whether there's a collision
    hit = false;

    //Find the center points of each sprite
    r1.centerX = r1.x + r1.width / 2;
    r1.centerY = r1.y + r1.height / 2;
    r2.centerX = r2.x + r2.width / 2;
    r2.centerY = r2.y + r2.height / 2;

    //Find the half-widths and half-heights of each sprite
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;

    //Calculate the distance vector between the sprites
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {

        //A collision might be occurring. Check for a collision on the y axis
        if (Math.abs(vy) < combinedHalfHeights) {

            //There's definitely a collision happening
            hit = true;
        } else {

            //There's no collision on the y axis
            hit = false;
        }
    } else {

        //There's no collision on the x axis
        hit = false;
    }

    //`hit` will be either `true` or `false`
    return hit;
};