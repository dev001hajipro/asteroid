/// <reference path="../p5.global-mode.d.ts" />

class Ship {
    constructor() {
        this.position = createVector(width/2, height/2);
        this.r = 10;
        this.heading = 0.0;
        this.rotation = 0.0;
        this.velocity = createVector(0, 0);
        this.isBoosting = false;
    }
    update() {
        this.isBoosting && this.boost();

        this.position.add(this.velocity);
        this.velocity.mult(0.95); // slow down by every frame.
    }
    render() {
        push();
        fill(100);
        stroke(255);
        translate(this.position.x, this.position.y);
        rotate(this.heading + PI / 2); // adjust 90 degrees.
        //triangle(-this.r/3*2, this.r, this.r/3*2, this.r, 0, -this.r);
        triangle(-this.r, this.r, this.r, this.r, 0, -this.r);
        ellipse(0, 0, this.r, this.r);
        point(0, 0);
        pop();
    }
    boosting(b) {
        this.isBoosting = b;
    }
    boost() {
        let forceVec = p5.Vector.fromAngle(this.heading);
        forceVec.mult(0.1);
        this.velocity.add(forceVec);
    }
    edges() {
        if (this.position.x > width + this.r) this.position.x = -this.r;
        if (this.position.x < -this.r) this.position.x = width + this.r;

        if (this.position.y > height + this.r) this.position.y = -this.r;
        if (this.position.y < -this.r) this.position.y = height + this.r;
    }
    setRotation(angle) {
        this.rotation = angle;
    }
    turn() {
        this.heading += this.rotation;
    }
    hits(asteroid) {
        let d = dist(this.position.x, this.position.y, asteroid.position.x, asteroid.position.y);
        return (d < this.r + asteroid.r)
    }
}

class Laser {
    constructor(shipPosition, angle) {
        this.position = shipPosition.copy();
        this.velocity = p5.Vector.
        fromAngle(angle);
        this.velocity.mult(10);
    }
    update() {
        this.position.add(this.velocity);
    }
    render() {
        push();
        stroke(255);
        strokeWeight(4);
        point(this.position.x, this.position.y);
        pop();
    }
    hits(asteroid) {
        let d = dist(this.position.x, this.position.y, asteroid.position.x, asteroid.position.y);
        return (d < asteroid.r)
    }

    offscreen() {
        return (this.position.x < 0 || this.position.x > width) || (this.position.y < 0 || this.position.y > height)

    }
}

class Asteroid {
    constructor(pos, r) {
        this.position = pos ? pos.copy() : createVector(random(width), random(height));
        this.r = r ? r*0.5 : random(15, 50);

        this.velocity = p5.Vector.random2D();
        this.total = floor(random(5, 15)); // vertex count.
        this.offset = Array.from({length: this.total}, (v,k)=> random(-this.r*0.5, this.r*0.5));
        
    }
    update() {
        this.position.add(this.velocity);
    }

    render() {
        push();
        noFill();
        stroke(255);
        translate(this.position.x, this.position.y);
        //ellipse(0, 0, this.r*2);
        beginShape();
        for (let i = 0; i < this.total; i++) {
            let angle = map(i, 0, this.total, 0, TWO_PI);
            let r = (this.r + this.offset[i]);
            let x = r * cos(angle);
            let y = r * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);
        pop();
    }
    edges() {
        if (this.position.x > width + this.r) this.position.x = -this.r;
        if (this.position.x < -this.r) this.position.x = width + this.r;

        if (this.position.y > height + this.r) this.position.y = -this.r;
        if (this.position.y < -this.r) this.position.y = height + this.r;
    }
    breakup() {
        return Array.from({length:2}, (v,k)=> new Asteroid(this.position.copy(), this.r));
    }
}

let ship;
let asteroids;
let lasers;
function setup() {
    noSmooth();
    createCanvas(400, 400);
    ship = new Ship();
    asteroids = Array.from({length: 5}, (v, k)=> new Asteroid());
    lasers = [];
}

function draw() {
    background(0);
    asteroids.forEach((v,i,a)=> {
        v.update();
        v.edges();
        v.render();
        if (ship.hits(v)) {
            console.log('ooops!');
        }
    });
    for (let i = lasers.length -1; i >= 0; i--) {
        lasers[i].update();
        lasers[i].render();

        // remove if offscreen
        if (lasers[i].offscreen()) {
            lasers.splice(i, 1);
        } else {
            // https://youtu.be/xTTuih7P0c0?t=8m1s
            // intersect
            for (let j = 0; j < asteroids.length; j++) {
                if (lasers[i].hits(asteroids[j])) {
                    if (asteroids[j].r > 10) {
                        let newAsteroids = asteroids[j].breakup();
                        asteroids = asteroids.concat(newAsteroids);    
                    } else {
                        // todo: increase the score.
                    }
                    asteroids.splice(j, 1); // remove index 'j' element.
                    lasers.splice(i, 1); // remove index 'j' element.
                    break;
                }
            }
        }
    }

    ship.turn();    
    ship.edges();
    ship.update();
    ship.render();
}

function keyPressed() {
    key == ' ' && lasers.push(new Laser(ship.position, ship.heading));

    if (keyCode === RIGHT_ARROW) {
        ship.setRotation(0.1);
    }
    if (keyCode === LEFT_ARROW) {
        ship.setRotation(-0.1);
    }
    if (keyCode == UP_ARROW) {
        ship.boosting(true);
    }
}

function keyReleased() {
    ship.setRotation(0.0);
    ship.boosting(false);
}

window.addEventListener('keydown', (e)=> e.preventDefault());