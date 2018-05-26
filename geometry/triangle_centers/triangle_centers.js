var APP_MOUSE_POSITION;
var ACTIVE_MARKER;

var TRIANGLE_CORNERS, TRIANGLE_CENTERS;

function setup() {
    angleMode(RADIANS);

    TRIANGLE_CORNERS = {
        "A": new LocationMarker(color('#fe6779'), createVector(360, 100)),
        "B": new LocationMarker(color('#ffa285'), createVector(100, 640)),
        "C": new LocationMarker(color('#428ae0'), createVector(640, 640)),
    };

    TRIANGLE_CENTERS = {
        "centroid": new LocationMarker(color('#7324a6'), createVector(0, 0)),
    };

    createCanvas(windowWidth, windowHeight);
    app = new App();
    ACTIVE_MARKER = null;
}

function draw() {
    background(color('white'));
    app.display();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // app.resize();
}

function mousePressed() {
    _.each(TRIANGLE_CORNERS, function(marker) {
        if (APP_MOUSE_POSITION.dist(marker.position) <= marker.radius) {
            ACTIVE_MARKER = marker;
        }
    });
}

function mouseReleased() {
    ACTIVE_MARKER = null;
}

function mouseDragged() {
    if (ACTIVE_MARKER != null) {
        ACTIVE_MARKER.position = APP_MOUSE_POSITION;
    }
}

// https://stackoverflow.com/questions/19723641/find-intersecting-point-of-three-circles-programmatically
function calculateThreeCircleIntersection(circle0, circle1, circle2) {
    var a, dx, dy, d, h, rx, ry;
    var point2_x, point2_y;

    x0 = circle0.centroid.x;
    y0 = circle0.centroid.y;
    r0 = circle0.radius;

    x1 = circle1.centroid.x;
    y1 = circle1.centroid.y;
    r1 = circle1.radius;

    x2 = circle2.centroid.x;
    y2 = circle2.centroid.y;
    r2 = circle2.radius;

    /* dx and dy are the vertical and horizontal distances between
    * the circle centers.
    */
    dx = x1 - x0;
    dy = y1 - y0;

    /* Determine the straight-line distance between the centers. */
    d = p5.Vector.dist(circle0.centroid, circle1.centroid);

    /* Check for solvability. */
    if (d > (r0 + r1))
    {
        /* no solution. circles do not intersect. */
        return false;
    }
    if (d < abs(r0 - r1))
    {
        /* no solution. one circle is contained in the other */
        return false;
    }

    /* 'point 2' is the point where the line through the circle
    * intersection points crosses the line between the circle
    * centers.
    */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

    /* Determine the coordinates of point 2. */
    point2_x = x0 + (dx * a/d);
    point2_y = y0 + (dy * a/d);

    /* Determine the distance from point 2 to either of the
    * intersection points.
    */
    h = sqrt((r0*r0) - (a*a));

    /* Now determine the offsets of the intersection points from
    * point 2.
    */
    rx = -dy * (h/d);
    ry = dx * (h/d);

    /* Determine the absolute intersection points. */
    var i_pt1_x = point2_x + rx;
    var i_pt2_x = point2_x - rx;
    var i_pt1_y = point2_y + ry;
    var i_pt2_y = point2_y - ry;

    /* Lets determine if circle 3 intersects at either of the above intersection points. */
    dx = i_pt1_x - x2;
    dy = i_pt1_y - y2;

    var d1 = sqrt((dy*dy) + (dx*dx));

    dx = i_pt2_x - x2;
    dy = i_pt2_y - y2;

    var d2 = sqrt((dy*dy) + (dx*dx));

    var intersection_pt;
    if(abs(d1 - r2) < abs(d2 - r2)) {
        intersection_pt = createVector(i_pt1_x, i_pt1_y);
    }
    else {
        intersection_pt = createVector(i_pt2_x, i_pt2_y);
    }
    return intersection_pt;
}

function getDirectionAngle(cursor, position) {
    var vec = p5.Vector.sub(cursor, position);
    return vec.heading();
}

function getAngleBetweenTwoPoints(cursor, posA, posB) {
    var vecA = p5.Vector.sub(cursor, posA);
    var vecB = p5.Vector.sub(cursor, posB);
    return p5.Vector.angleBetween(vecA, vecB);
}

function getSignedAngleBetweenTwoHeadings(angleA, angleB) {
    var vecA = p5.Vector.fromAngle(angleA);
    var vecB = p5.Vector.fromAngle(angleB);
    angle = atan2(vecB.y, vecB.x) - atan2(vecA.y, vecA.x);
    if (angle < 0){
        angle += 2 * PI;
    }
    return angle;
}

function circleFrom3Points(p1, p2, p3) {
    var deltaA = p5.Vector.sub(p2, p1),
        deltaB = p5.Vector.sub(p3, p2),
        centroid,
        radius;

    if (abs(deltaA.x) <= Number.EPSILON && abs(deltaB.y) <= Number.EPSILON) {
        centroid = createVector(p2.x + p3.x, p1.y + p2.y).mult(0.5);
        radius = centroid.dist(p1);
    } 
    else {
        var aSlope = deltaA.y / deltaA.x;
        var bSlope = deltaB.y / deltaB.x;
        if (abs(aSlope - bSlope) > Number.EPSILON && aSlope !== 0) {
            var x = (aSlope * bSlope * (p1.y - p3.y) + bSlope * (p1.x + p2.x) - aSlope * (p2.x + p3.x)) / (2 * (bSlope - aSlope));
            var y = -(x - (p1.x + p2.x) / 2) / aSlope + (p1.y + p2.y) / 2;
            centroid = createVector(x, y);
            radius = centroid.dist(p1);
        }
    }
    
    return new Circle(radius, centroid);
}

function midpoint(A, B) {
    AB = p5.Vector.sub(B, A);
    M = p5.Vector.add(A, AB.mult(0.5));
    return M;
}

function cot(x) {
    return 1 / tan(x);
}

function hAB(A, B, theta) {
    AB = p5.Vector.sub(B, A);
    xAB = AB.mag() / 2.0;
    return xAB * cot(theta / 2.0);
}

function perpUnitVec(A, B) {
    AB = p5.Vector.sub(B, A);
    AB_perp = AB.rotate(HALF_PI);
    AB_perp.normalize();
    return AB_perp;
}

// MAP
var App = function() {
    this.scale = 1.0;
    this.position = createVector(0, 0);
    this.width = 1280;
    this.height = 720;
}

App.prototype.resize  = function() {
    this.scale = windowHeight / this.height;
}

App.prototype.updateAppCursor = function() {
    map_mouse_x = mouseX / this.scale - this.position.x;
    map_mouse_y = mouseY / this.scale - this.position.y;

    APP_MOUSE_POSITION = createVector(map_mouse_x, map_mouse_y);
}

App.prototype.display = function() {
    this.updateAppCursor();

    push();
    scale(this.scale);
    translate(this.position.x, this.position.y);
    noFill();
    stroke(color('black'));
    strokeWeight(3);
    triangle(
        TRIANGLE_CORNERS['A'].position.x,
        TRIANGLE_CORNERS['A'].position.y,
        TRIANGLE_CORNERS['B'].position.x,
        TRIANGLE_CORNERS['B'].position.y,
        TRIANGLE_CORNERS['C'].position.x,
        TRIANGLE_CORNERS['C'].position.y,
    );
    _.each(TRIANGLE_CORNERS, function(marker) {
        marker.display();
    });

    updateCentroid();

    pop();
}

function updateCentroid() {

}

App.prototype.displayDebug = function() {

}

function get_estimation(a_pos, b_pos, a_angle, b_angle) {
    ab_angle = getSignedAngleBetweenTwoHeadings(a_angle, b_angle);

    hMag = hAB(a_pos, b_pos, ab_angle);
    hVec = perpUnitVec(a_pos, b_pos);
    mgp = midpoint(a_pos, b_pos);
    h = p5.Vector.add(mgp, hVec.setMag(hMag));

    return h;
}

var Circle = function(radius, centroid) {
    this.radius = radius;
    this.centroid = centroid;
}

Circle.prototype.display = function() {
    push();
    ellipseMode(CENTER);
    noFill();
    stroke(color('black'));
    strokeWeight(3);
    ellipse(this.centroid.x, this.centroid.y, 2 * this.radius);
    pop();
};

// LOCATION MARKER
var LocationMarker = function(marker_color, position) {
    this.color = marker_color;
    this.position = position;
}

LocationMarker.prototype.display = function() {
    // Update
    this.radius = 10;

    // Draw
    push();
    ellipseMode(CENTER); 
    stroke(color('black'));
    strokeWeight(3);
    fill(this.color);
    ellipse(this.position.x, this.position.y, 2*this.radius);
    pop();
}
