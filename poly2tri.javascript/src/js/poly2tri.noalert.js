/*
 * Poly2Tri Copyright (c) 2009-2010, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of Poly2Tri nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

//Namespace('p2t');
var p2t = { sweep:{} };

// ------------------------------------------------------------------------Point
p2t.Point = function() {
    this.x = null;
    this.y = null;
    
    if (arguments.length == 0) {
        this.x = 0.0;
        this.y = 0.0;
    } else if (arguments.length == 2) {
        this.x = arguments[0];
        this.y = arguments[1];
    } else {
        alert('Invalid p2t.Point constructor call!');
    }

    // The edges this point constitutes an upper ending point
    this.edge_list = [];

}

/**
 * Set this Point instance to the origo. <code>(0; 0)</code>
 */
p2t.Point.prototype.set_zero = function() {
    this.x = 0.0;
    this.y = 0.0;
}

/**
 * Set the coordinates of this instance.
 * @param   x   number.
 * @param   y   number;
 */
p2t.Point.prototype.set = function(x, y) {
    this.x = x;
    this.y = y;
}

/**
 * Negate this Point instance. (component-wise)
 */
/*p2t.Point.prototype.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
}*/

/**
 * Add another Point object to this instance. (component-wise)
 * @param   n   Point object.
 */
/*p2t.Point.prototype.add = function(n) {
    this.x += n.x;
    this.y += n.y;
}*/

/**
 * Subtract this Point instance with another point given. (component-wise)
 * @param   n   Point object.
 */
/*p2t.Point.prototype.sub = function(n) {
    this.x -= n.x;
    this.y -= n.y;
}*/

/**
 * Multiply this Point instance by a scalar. (component-wise)
 * @param   s   scalar.
 */
/*p2t.Point.prototype.mul = function(s) {
    this.x *= s;
    this.y *= s;
}*/

/**
 * Return the distance of this Point instance from the origo.
 */
p2t.Point.prototype.length = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
}

/**
 * Normalize this Point instance (as a vector).
 * @return The original distance of this instance from the origo.
 */
/*p2t.Point.prototype.normalize = function() {
    var len = this.length();
    this.x /= len;
    this.y /= len;
    return len;
}*/

/**
 * Test this Point object with another for equality.
 * @param   p   Point object.
 * @return <code>True</code> if <code>this == p</code>, <code>false</code> otherwise.
 */
p2t.Point.prototype.equals = function(p) {
    return p2t.equals(this, p);
}

/**
 * Negate a point component-wise and return the result as a new Point object.
 * @param   p   Point object.
 * @return the resulting Point object.
 */
/*p2t.negate = function(p) {
    return new p2t.Point(-p.x, -p.y);
}*/

/**
 * Compare two points component-wise.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return <code>-1</code> if <code>a &lt; b</code>, <code>1</code> if
 *         <code>a &gt; b</code>, <code>0</code> otherwise.
 */
p2t.cmp = function(a, b) {
    if (a.y == b.y) {
        return a.x - b.x;
    } else {
        return a.y - b.y;
    }
}

/**
 * Add two points component-wise and return the result as a new Point object.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return the resulting Point object.
 */
/*p2t.add = function(a, b) {
    return new p2t.Point(a.x+b.x, a.y+b.y);
}*/

/**
 * Subtract two points component-wise and return the result as a new Point object.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return the resulting Point object.
 */
/*p2t.sub = function(a, b) {
    return new p2t.Point(a.x-b.x, a.y-b.y);
}*/

/**
 * Multiply a point by a scalar and return the result as a new Point object.
 * @param   s   the scalar (a number).
 * @param   p   Point object.
 * @return the resulting Point object.
 */
/*p2t.mul = function(s, p) {
    return new p2t.Point(s*p.x, s*p.y);
}*/

/**
 * Test two Point objects for equality.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return <code>True</code> if <code>a == b</code>, <code>false</code> otherwise.
 */
p2t.equals = function(a, b) {
    return a.x == b.x && a.y == b.y;
}

/**
 * Peform the dot product on two vectors.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return The dot product (as a number).
 */
p2t.dot = function(a, b) {
    return a.x*b.x + a.y*b.y;
}

/**
 * Perform the cross product on either two points (this produces a scalar)
 * or a point and a scalar (this produces a point).
 * This function requires two parameters, either may be a Point object or a
 * number.
 * @return a Point object or a number, depending on the parameters.
 */
p2t.cross = function() {
    var a0_p = false;
    var a1_p = false;
    if (arguments.length == 2) {
        if (typeof(arguments[0]) == 'number') {
            a0_p = true;
        }
        if (typeof(arguments[1] == 'number')) {
            a1_p = true;
        }

        if (a0_p) {
            if (a1_p) return arguments[0].x*arguments[1].y - arguments[0].y*arguments[1].x;
            else return new p2t.Point(arguments[1]*arguments[0].y, -arguments[1]*arguments[0].x);
        } else {
            if (a1_p) return new p2t.Point(-arguments[0]*arguments[1].y, arguments[0]*arguments[1].x);
            else return arguments[0]*arguments[1];
        }
    } else {
        alert('Invalid p2t.cross call!');
        return undefined;
    }
}


// -------------------------------------------------------------------------Edge
p2t.Edge = function() {
    this.p = null;
    this.q = null;
    
    if (arguments.length == 2) {
        if (arguments[0].y > arguments[1].y) {
            this.q = arguments[0];
            this.p = arguments[1];
        } else if (arguments[0].y == arguments[1].y) {
            if (arguments[0].x > arguments[1].x) {
                this.q = arguments[0];
                this.p = arguments[1];
            } else if (arguments[0].x == arguments[1].x) {
                alert('Invalid p2t.edge constructor call: repeated points!');
            } else {
                this.p = arguments[0];
                this.q = arguments[1];
            }
        } else {
            this.p = arguments[0];
            this.q = arguments[1];
        }
    } else {
        alert('Invalid p2t.Edge constructor call!');
    }

    this.q.edge_list.push(this);
}

// ---------------------------------------------------------------------Triangle
/**
 * Triangle class.<br>
 * Triangle-based data structures are known to have better performance than
 * quad-edge structures.
 * See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and
 * Delaunay Triangulator", "Triangulations in CGAL"
 * 
 * @param   p1  Point object.
 * @param   p2  Point object.
 * @param   p3  Point object.
 */
p2t.Triangle = function(p1, p2, p3) {
    // Triangle points
    this.points_ = [ null, null, null ];
    // Neighbor list
    this.neighbors_ = [ null, null, null ];
    // Has this triangle been marked as an interior triangle?
    this.interior_ = false;
    // Flags to determine if an edge is a Constrained edge
    this.constrained_edge = [ false, false, false ];
    // Flags to determine if an edge is a Delauney edge
    this.delaunay_edge = [ false, false, false ];

    if (arguments.length == 3) {
        this.points_[0] = p1;
        this.points_[1] = p2;
        this.points_[2] = p3;
    }
}

p2t.Triangle.prototype.GetPoint = function(index) {
    return this.points_[index];
}

p2t.Triangle.prototype.GetNeighbor = function(index) {
    return this.neighbors_[index];
}

/**
 * Test if this Triangle contains the Point objects given as parameters as its
 * vertices.
 * @return <code>True</code> if the Point objects are of the Triangle's vertices,
 *         <code>false</code> otherwise.
 */
p2t.Triangle.prototype.ContainsP = function() {
    var back = true;
    for (var aidx=0; aidx < arguments.length; ++aidx) {
        back = back && (arguments[aidx].equals(this.points_[0]) ||
                        arguments[aidx].equals(this.points_[1]) ||
                        arguments[aidx].equals(this.points_[2])
        );
    }
    return back;
}

/**
 * Test if this Triangle contains the Edge objects given as parameters as its
 * bounding edges.
 * @return <code>True</code> if the Edge objects are of the Triangle's bounding
 *         edges, <code>false</code> otherwise.
 */
p2t.Triangle.prototype.ContainsE = function() {
    var back = true;
    for (var aidx=0; aidx < arguments.length; ++aidx) {
        back = back && this.ContainsP(arguments[aidx].p, arguments[aidx].q);
    }
    return back;
}

p2t.Triangle.prototype.IsInterior = function() {
    if (arguments.length == 0) {
        return this.interior_;
    } else {
        this.interior_ = arguments[0];
        return this.interior_;
    }
}

/**
 * Update neighbor pointers.<br>
 * This method takes either 3 parameters (<code>p1</code>, <code>p2</code> and
 * <code>t</code>) or 1 parameter (<code>t</code>).
 * @param   p1  Point object.
 * @param   p2  Point object.
 * @param   t   Triangle object.
 */
p2t.Triangle.prototype.MarkNeighbor = function() {
    var t;
    if (arguments.length == 3) {
        var p1 = arguments[0];
        var p2 = arguments[1];
        t = arguments[2];

        if ((p1.equals(this.points_[2]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[2]))) this.neighbors_[0] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[2])) || (p1.equals(this.points_[2]) && p2.equals(this.points_[0]))) this.neighbors_[1] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[0]))) this.neighbors_[2] = t;
        else alert('Invalid p2t.Triangle.MarkNeighbor call (1)!');
    } else if (arguments.length == 1) {
        // exhaustive search to update neighbor pointers
        t = arguments[0];
        if (t.ContainsP(this.points_[1], this.points_[2])) {
            this.neighbors_[0] = t;
            t.MarkNeighbor(this.points_[1], this.points_[2], this);
        } else if (t.ContainsP(this.points_[0], this.points_[2])) {
            this.neighbors_[1] = t;
            t.MarkNeighbor(this.points_[0], this.points_[2], this);
        } else if (t.ContainsP(this.points_[0], this.points_[1])) {
            this.neighbors_[2] = t;
            t.MarkNeighbor(this.points_[0], this.points_[1], this);
        }
    } else {
        alert('Invalid p2t.Triangle.MarkNeighbor call! (2)');
    }
}

p2t.Triangle.prototype.ClearNeigbors = function() {
    this.neighbors_[0] = null;
    this.neighbors_[1] = null;
    this.neighbors_[2] = null;
}

p2t.Triangle.prototype.ClearDelunayEdges = function() {
    this.delaunay_edge[0] = false;
    this.delaunay_edge[1] = false;
    this.delaunay_edge[2] = false;
}

/**
 * Return the point clockwise to the given point.
 */
p2t.Triangle.prototype.PointCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.points_[2];
    } else if (p.equals(this.points_[1])) {
        return this.points_[0];
    } else if (p.equals(this.points_[2])) {
        return this.points_[1];
    } else {
        return null;
    }
}

/**
 * Return the point counter-clockwise to the given point.
 */
p2t.Triangle.prototype.PointCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.points_[1];
    } else if (p.equals(this.points_[1])) {
        return this.points_[2];
    } else if (p.equals(this.points_[2])) {
        return this.points_[0];
    } else {
        return null;
    }
}

/**
 * Return the neighbor clockwise to given point.
 */
p2t.Triangle.prototype.NeighborCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[1];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[2];
    } else {
        return this.neighbors_[0];
    }
}

/**
 * Return the neighbor counter-clockwise to given point.
 */
p2t.Triangle.prototype.NeighborCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[2];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[0];
    } else {
        return this.neighbors_[1];
    }
}

p2t.Triangle.prototype.GetConstrainedEdgeCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.constrained_edge[1];
    } else if (p.equals(this.points_[1])) {
        return this.constrained_edge[2];
    } else {
        return this.constrained_edge[0];
    }
}

p2t.Triangle.prototype.GetConstrainedEdgeCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.constrained_edge[2];
    } else if (p.equals(this.points_[1])) {
        return this.constrained_edge[0];
    } else {
        return this.constrained_edge[1];
    }
}

p2t.Triangle.prototype.SetConstrainedEdgeCW = function(p, ce) {
    if (p.equals(this.points_[0])) {
        this.constrained_edge[1] = ce;
    } else if (p.equals(this.points_[1])) {
        this.constrained_edge[2] = ce;
    } else {
        this.constrained_edge[0] = ce;
    }
}

p2t.Triangle.prototype.SetConstrainedEdgeCCW = function(p, ce) {
    if (p.equals(this.points_[0])) {
        this.constrained_edge[2] = ce;
    } else if (p.equals(this.points_[1])) {
        this.constrained_edge[0] = ce;
    } else {
        this.constrained_edge[1] = ce;
    }
}

p2t.Triangle.prototype.GetDelaunayEdgeCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.delaunay_edge[1];
    } else if (p.equals(this.points_[1])) {
        return this.delaunay_edge[2];
    } else {
        return this.delaunay_edge[0];
    }
}

p2t.Triangle.prototype.GetDelaunayEdgeCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.delaunay_edge[2];
    } else if (p.equals(this.points_[1])) {
        return this.delaunay_edge[0];
    } else {
        return this.delaunay_edge[1];
    }
}

p2t.Triangle.prototype.SetDelaunayEdgeCW = function(p, e) {
    if (p.equals(this.points_[0])) {
        this.delaunay_edge[1] = e;
    } else if (p.equals(this.points_[1])) {
        this.delaunay_edge[2] = e;
    } else {
        this.delaunay_edge[0] = e;
    }
}

p2t.Triangle.prototype.SetDelaunayEdgeCCW = function(p, e) {
    if (p.equals(this.points_[0])) {
        this.delaunay_edge[2] = e;
    } else if (p.equals(this.points_[1])) {
        this.delaunay_edge[0] = e;
    } else {
        this.delaunay_edge[1] = e;
    }
}

/**
 * The neighbor across to given point.
 */
p2t.Triangle.prototype.NeighborAcross = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[0];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[1];
    } else {
        return this.neighbors_[2];
    }
}

p2t.Triangle.prototype.OppositePoint = function(t, p) {
    var cw = t.PointCW(p);
    return this.PointCW(cw);
}

/**
 * Legalize triangle by rotating clockwise.<br>
 * This method takes either 1 parameter (then the triangle is rotated around
 * points(0)) or 2 parameters (then the triangle is rotated around the first
 * parameter).
 */
p2t.Triangle.prototype.Legalize = function() {
    if (arguments.length == 1) {
        this.Legalize(this.points_[0], arguments[0]);
    } else if (arguments.length == 2) {
        var opoint = arguments[0];
        var npoint = arguments[1];

        if (opoint.equals(this.points_[0])) {
            this.points_[1] = this.points_[0];
            this.points_[0] = this.points_[2];
            this.points_[2] = npoint;
        } else if (opoint.equals(this.points_[1])) {
            this.points_[2] = this.points_[1];
            this.points_[1] = this.points_[0];
            this.points_[0] = npoint;
        } else if (opoint.equals(this.points_[2])) {
            this.points_[0] = this.points_[2];
            this.points_[2] = this.points_[1];
            this.points_[1] = npoint;
        } else {
            alert('Invalid p2t.Triangle.Legalize call!');
        }
    } else {
        alert('Invalid p2t.Triangle.Legalize call!');
    }
}

p2t.Triangle.prototype.Index = function(p) {
    if (p.equals(this.points_[0])) return 0;
    else if (p.equals(this.points_[1])) return 1;
    else if (p.equals(this.points_[2])) return 2;
    else return -1;
}

p2t.Triangle.prototype.EdgeIndex = function(p1, p2) {
    if (p1.equals(this.points_[0])) {
        if (p2.equals(this.points_[1])) {
            return 2;
        } else if (p2.equals(this.points_[2])) {
            return 1;
        }
    } else if (p1.equals(this.points_[1])) {
        if (p2.equals(this.points_[2])) {
            return 0;
        } else if (p2.equals(this.points_[0])) {
            return 2;
        }
    } else if (p1.equals(this.points_[2])) {
        if (p2.equals(this.points_[0])) {
            return 1;
        } else if (p2.equals(this.points_[1])) {
            return 0;
        }
    }
    return -1;
}

/**
 * Mark an edge of this triangle as constrained.<br>
 * This method takes either 1 parameter (an edge index or an Edge instance) or
 * 2 parameters (two Point instances defining the edge of the triangle).
 */
p2t.Triangle.prototype.MarkConstrainedEdge = function() {
    if (arguments.length == 1) {
        if (typeof(arguments[0]) == 'number') {
            this.constrained_edge[arguments[0]] = true;
        } else {
            this.MarkConstrainedEdge(arguments[0].p, arguments[0].q);
        }
    } else if (arguments.length == 2) {
        var p = arguments[0];
        var q = arguments[1];
        if ((q.equals(this.points_[0]) && p.equals(this.points_[1])) || (q.equals(this.points_[1]) && p.equals(this.points_[0]))) {
            this.constrained_edge[2] = true;
        } else if ((q.equals(this.points_[0]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[0]))) {
            this.constrained_edge[1] = true;
        } else if ((q.equals(this.points_[1]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[1]))) {
            this.constrained_edge[0] = true;
        }
    } else {
        alert('Invalid p2t.Triangle.MarkConstrainedEdge call!');
    }
}

// ------------------------------------------------------------------------utils
p2t.PI_3div4 = 3 * Math.PI / 4;
p2t.PI_2 = Math.PI / 2;
p2t.EPSILON = 1e-12;

/* 
 * Inital triangle factor, seed triangle will extend 30% of
 * PointSet width to both left and right.
 */
p2t.kAlpha = 0.3;

p2t.Orientation = {
    "CW"        : 1,
    "CCW"       : -1,
    "COLLINEAR" : 0
};

/**
 * Forumla to calculate signed area<br>
 * Positive if CCW<br>
 * Negative if CW<br>
 * 0 if collinear<br>
 * <pre>
 * A[P1,P2,P3]  =  (x1*y2 - y1*x2) + (x2*y3 - y2*x3) + (x3*y1 - y3*x1)
 *              =  (x1-x3)*(y2-y3) - (y1-y3)*(x2-x3)
 * </pre>
 */
p2t.Orient2d = function(pa, pb, pc) {
    var detleft = (pa.x - pc.x) * (pb.y - pc.y);
    var detright = (pa.y - pc.y) * (pb.x - pc.x);
    var val = detleft - detright;
    if (val > -(p2t.EPSILON) && val < (p2t.EPSILON)) {
        return p2t.Orientation.COLLINEAR;
    } else if (val > 0) {
        return p2t.Orientation.CCW;
    } else {
        return p2t.Orientation.CW;
    }
}

p2t.InScanArea = function(pa, pb, pc, pd) {
    var pdx = pd.x;
    var pdy = pd.y;
    var adx = pa.x - pdx;
    var ady = pa.y - pdy;
    var bdx = pb.x - pdx;
    var bdy = pb.y - pdy;

    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;

    if (oabd <= (p2t.EPSILON)) {
        return false;
    }

    var cdx = pc.x - pdx;
    var cdy = pc.y - pdy;

    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;

    if (ocad <= (p2t.EPSILON)) {
        return false;
    }

    return true;
}

// ---------------------------------------------------------------AdvancingFront
p2t.Node = function() {
    this.point = null; // Point
    this.triangle = null; // Triangle

    this.next = null; // Node
    this.prev = null; // Node

    this.value = 0.0; // double

    if (arguments.length == 1) {
        this.point = arguments[0];
        this.value = this.point.x;
    } else if (arguments.length == 2) {
        this.point = arguments[0];
        this.triangle = arguments[1];
        this.value = this.point.x;
    } else {
        alert('Invalid p2t.Node constructor call!');
    }
}

p2t.AdvancingFront = function(head, tail) {
    this.head_ = head; // Node
    this.tail_ = tail; // Node
    this.search_node_ = head; // Node
}

p2t.AdvancingFront.prototype.head = function() {
    return this.head_;
}

p2t.AdvancingFront.prototype.set_head = function(node) {
    this.head_ = node;
}

p2t.AdvancingFront.prototype.tail = function() {
    return this.tail_;
}

p2t.AdvancingFront.prototype.set_tail = function(node) {
    this.tail_ = node;
}

p2t.AdvancingFront.prototype.search = function() {
    return this.search_node_;
}

p2t.AdvancingFront.prototype.set_search = function(node) {
    this.search_node_ = node;
}

p2t.AdvancingFront.prototype.FindSearchNode = function(x) {
    return this.search_node_;
}

p2t.AdvancingFront.prototype.LocateNode = function(x) {
    var node = this.search_node_;

    if (x < node.value) {
        while ((node = node.prev) != null) {
            if (x >= node.value) {
                this.search_node_ = node;
                return node;
            }
        }
    } else {
        while ((node = node.next) != null) {
            if (x < node.value) {
                this.search_node_ = node.prev;
                return node.prev;
            }
        }
    }
    return null;
}

p2t.AdvancingFront.prototype.LocatePoint = function(point) {
    var px = point.x;
    var node = this.FindSearchNode(px);
    var nx = node.point.x;

    if (px == nx) {
        // We might have two nodes with same x value for a short time
        if (node.prev && point.equals(node.prev.point)) {
            node = node.prev;
        } else if (node.next && point.equals(node.next.point)) {
            node = node.next;
        } else if (point.equals(node.point)) {
            // do nothing
        } else {
            alert('Invalid p2t.AdvancingFront.LocatePoint call!');
            return null;
        }
    } else if (px < nx) {
        while ((node = node.prev) != null) {
            if (point.equals(node.point)) break;
        }
    } else {
        while ((node = node.next) != null) {
            if (point.equals(node.point)) break;
        }
    }

    if (node != null) this.search_node_ = node;
    return node;
}

// ------------------------------------------------------------------------Basin
p2t.Basin = function() {
    this.left_node = null; // Node
    this.bottom_node = null; // Node
    this.right_node = null; // Node
    this.width = 0.0; // number
    this.left_highest = false;
}

p2t.Basin.prototype.Clear = function() {
    this.left_node = null;
    this.bottom_node = null;
    this.right_node = null;
    this.width = 0.0;
    this.left_highest = false;
}

// --------------------------------------------------------------------EdgeEvent
p2t.EdgeEvent = function() {
    this.constrained_edge = null; // Edge
    this.right = false;
}

// -----------------------------------------------------------------SweepContext
p2t.SweepContext = function(polyline) {
    this.triangles_ = [];
    this.map_ = [];
    this.points_ = polyline;
    this.edge_list = [];

    // Advancing front
    this.front_ = null; // AdvancingFront
    // head point used with advancing front
    this.head_ = null; // Point
    // tail point used with advancing front
    this.tail_ = null; // Point

    this.af_head_ = null; // Node
    this.af_middle_ = null; // Node
    this.af_tail_ = null; // Node

    this.basin = new p2t.Basin();
    this.edge_event = new p2t.EdgeEvent();

    this.InitEdges(this.points_);
}

p2t.SweepContext.prototype.AddHole = function(polyline) {
    this.InitEdges(polyline);
    for (var i in polyline) {
        this.points_.push(polyline[i]);
    }
}

p2t.SweepContext.prototype.front = function() {
    return this.front_;
}

p2t.SweepContext.prototype.point_count = function() {
    return this.points_.length;
}

p2t.SweepContext.prototype.head = function() {
    return this.head_;
}

p2t.SweepContext.prototype.set_head = function(p1) {
    this.head_ = p1;
}

p2t.SweepContext.prototype.tail = function() {
    return this.tail_;
}

p2t.SweepContext.prototype.set_tail = function(p1) {
    this.tail_ = p1;
}

p2t.SweepContext.prototype.GetTriangles = function() {
    return this.triangles_;
}

p2t.SweepContext.prototype.GetMap = function() {
    return this.map_;
}

p2t.SweepContext.prototype.InitTriangulation = function() {
    var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;

    // Calculate bounds
    for (var i in this.points_) {
        var p = this.points_[i];
        if (p.x > xmax) xmax = p.x;
        if (p.x < xmin) xmin = p.x;
        if (p.y > ymax) ymax = p.y;
        if (p.y < ymin) ymin = p.y;
    }

    var dx = p2t.kAlpha * (xmax - xmin);
    var dy = p2t.kAlpha * (ymax - ymin);
    this.head_ = new p2t.Point(xmax + dx, ymin - dy);
    this.tail_ = new p2t.Point(xmin - dy, ymin - dy);

    // Sort points along y-axis
    this.points_.sort(p2t.cmp);
}

p2t.SweepContext.prototype.InitEdges = function(polyline) {
    for (var i=0; i < polyline.length; ++i) {
        this.edge_list.push(new p2t.Edge(polyline[i], polyline[(i+1) % polyline.length]));
    }
}

p2t.SweepContext.prototype.GetPoint = function(index) {
    return this.points_[index];
}

p2t.SweepContext.prototype.AddToMap = function(triangle) {
    this.map_.push(triangle);
}

p2t.SweepContext.prototype.LocateNode = function(point) {
    return this.front_.LocateNode(point.x);
}

p2t.SweepContext.prototype.CreateAdvancingFront = function() {
    var head;
    var middle;
    var tail;
    // Initial triangle
    var triangle = new p2t.Triangle(this.points_[0], this.tail_, this.head_);

    this.map_.push(triangle);

    head = new p2t.Node(triangle.GetPoint(1), triangle);
    middle = new p2t.Node(triangle.GetPoint(0), triangle);
    tail = new p2t.Node(triangle.GetPoint(2));

    this.front_ = new p2t.AdvancingFront(head, tail);

    head.next = middle;
    middle.next = tail;
    middle.prev = head;
    tail.prev = middle;
}

p2t.SweepContext.prototype.RemoveNode = function(node) {
    // do nothing
}

p2t.SweepContext.prototype.MapTriangleToNodes = function(t) {
    for (var i=0; i<3; ++i) {
        if (t.GetNeighbor(i) == null) {
            var n = this.front_.LocatePoint(t.PointCW(t.GetPoint(i)));
            if (n != null) {
                n.triangle = t;
            }
        }
    }
}

p2t.SweepContext.prototype.RemoveFromMap = function(triangle) {
    for (var i in this.map_) {
        if (this.map_[i] == triangle) {
            delete this.map_[i];
            break;
        }
    }
}

p2t.SweepContext.prototype.MeshClean = function(triangle) {
    if (triangle != null && !triangle.IsInterior()) {
        triangle.IsInterior(true);
        this.triangles_.push(triangle);
        for (var i=0; i<3; ++i) {
            if (!triangle.constrained_edge[i]) {
                this.MeshClean(triangle.GetNeighbor(i));
            }
        }
    }
}

// ------------------------------------------------------------------------Sweep
//Namespace('p2t.sweep');

/**
 * Triangulate simple polygon with holes.
 * @param   tcx SweepContext object.
 */
p2t.sweep.Triangulate = function(tcx) {
    tcx.InitTriangulation();
    tcx.CreateAdvancingFront();
    // Sweep points; build mesh
    p2t.sweep.SweepPoints(tcx);
    // Clean up
    p2t.sweep.FinalizationPolygon(tcx);
}

p2t.sweep.SweepPoints = function(tcx) {
    for (var i=1; i < tcx.point_count(); ++i) {
        var point = tcx.GetPoint(i);
        var node = p2t.sweep.PointEvent(tcx, point);
        for (var j=0; j < point.edge_list.length; ++j) {
            p2t.sweep.EdgeEvent(tcx, point.edge_list[j], node);
        }
    }
}

p2t.sweep.FinalizationPolygon = function(tcx) {
    // Get an Internal triangle to start with
    var t = tcx.front().head().next.triangle;
    var p = tcx.front().head().next.point;
    while (!t.GetConstrainedEdgeCW(p)) {
        t = t.NeighborCCW(p);
    }

    // Collect interior triangles constrained by edges
    tcx.MeshClean(t);
}

/**
 * Find closes node to the left of the new point and
 * create a new triangle. If needed new holes and basins
 * will be filled to.
 */
p2t.sweep.PointEvent = function(tcx, point) {
    var node = tcx.LocateNode(point);
    var new_node = p2t.sweep.NewFrontTriangle(tcx, point, node);

    // Only need to check +epsilon since point never have smaller
    // x value than node due to how we fetch nodes from the front
    if (point.x <= node.point.x + (p2t.EPSILON)) {
        p2t.sweep.Fill(tcx, node);
    }

    //tcx.AddNode(new_node);

    p2t.sweep.FillAdvancingFront(tcx, new_node);
    return new_node;
}

p2t.sweep.EdgeEvent = function() {
    var tcx;
    if (arguments.length == 3) {
        tcx = arguments[0];
        var edge = arguments[1];
        var node = arguments[2];

        tcx.edge_event.constrained_edge = edge;
        tcx.edge_event.right = (edge.p.x > edge.q.x);

        if (p2t.sweep.IsEdgeSideOfTriangle(node.triangle, edge.p, edge.q)) {
            return;
        }

        // For now we will do all needed filling
        // TODO: integrate with flip process might give some better performance
        //       but for now this avoid the issue with cases that needs both flips and fills
        p2t.sweep.FillEdgeEvent(tcx, edge, node);
        p2t.sweep.EdgeEvent(tcx, edge.p, edge.q, node.triangle, edge.q);
    } else if (arguments.length == 5) {
        tcx = arguments[0];
        var ep = arguments[1];
        var eq = arguments[2];
        var triangle = arguments[3];
        var point = arguments[4];

        if (p2t.sweep.IsEdgeSideOfTriangle(triangle, ep, eq)) {
            return;
        }

        var p1 = triangle.PointCCW(point);
        var o1 = p2t.Orient2d(eq, p1, ep);
        if (o1 == p2t.Orientation.COLLINEAR) {
            alert('p2t.sweep.EdgeEvent: Collinear not supported!');
            return;
        }

        var p2 = triangle.PointCW(point);
        var o2 = p2t.Orient2d(eq, p2, ep);
        if (o2 == p2t.Orientation.COLLINEAR) {
            alert('p2t.sweep.EdgeEvent: Collinear not supported!');
            return;
        }

        if (o1 == o2) {
            // Need to decide if we are rotating CW or CCW to get to a triangle
            // that will cross edge
            if (o1 == p2t.Orientation.CW) {
                triangle = triangle.NeighborCCW(point);
            } else {
                triangle = triangle.NeighborCW(point);
            }
            p2t.sweep.EdgeEvent(tcx, ep, eq, triangle, point);
        } else {
            // This triangle crosses constraint so lets flippin start!
            p2t.sweep.FlipEdgeEvent(tcx, ep, eq, triangle, point);
        }
    } else {
        alert('Invalid p2t.sweep.EdgeEvent call!');
    }
}

p2t.sweep.IsEdgeSideOfTriangle = function(triangle, ep, eq) {
    var index = triangle.EdgeIndex(ep, eq);
    if (index != -1) {
        triangle.MarkConstrainedEdge(index);
        var t = triangle.GetNeighbor(index);
        if (t != null) {
            t.MarkConstrainedEdge(ep, eq);
        }
        return true;
    }
    return false;    
}

p2t.sweep.NewFrontTriangle = function(tcx, point, node) {
    var triangle = new p2t.Triangle(point, node.point, node.next.point);

    triangle.MarkNeighbor(node.triangle);
    tcx.AddToMap(triangle);

    var new_node = new p2t.Node(point);
    new_node.next = node.next;
    new_node.prev = node;
    node.next.prev = new_node;
    node.next = new_node;

    if (!p2t.sweep.Legalize(tcx, triangle)) {
        tcx.MapTriangleToNodes(triangle);
    }

    return new_node;
}

/**
 * Adds a triangle to the advancing front to fill a hole.
 * @param tcx
 * @param node - middle node, that is the bottom of the hole
 */
p2t.sweep.Fill = function(tcx, node) {
    var triangle = new p2t.Triangle(node.prev.point, node.point, node.next.point);

    // TODO: should copy the constrained_edge value from neighbor triangles
    //       for now constrained_edge values are copied during the legalize
    triangle.MarkNeighbor(node.prev.triangle);
    triangle.MarkNeighbor(node.triangle);

    tcx.AddToMap(triangle);

    // Update the advancing front
    node.prev.next = node.next;
    node.next.prev = node.prev;


    // If it was legalized the triangle has already been mapped
    if (!p2t.sweep.Legalize(tcx, triangle)) {
        tcx.MapTriangleToNodes(triangle);
    }

    //tcx.RemoveNode(node);
}

/**
 * Fills holes in the Advancing Front
 */
p2t.sweep.FillAdvancingFront = function(tcx, n) {
    // Fill right holes
    var node = n.next;
    var angle;

    while (node.next != null) {
        angle = p2t.sweep.HoleAngle(node);
        if (angle > p2t.PI_2 || angle < -(p2t.PI_2)) break;
        p2t.sweep.Fill(tcx, node);
        node = node.next;
    }

    // Fill left holes
    node = n.prev;

    while (node.prev != null) {
        angle = p2t.sweep.HoleAngle(node);
        if (angle > p2t.PI_2 || angle < -(p2t.PI_2)) break;
        p2t.sweep.Fill(tcx, node);
        node = node.prev;
    }

    // Fill right basins
    if (n.next != null && n.next.next != null) {
        angle = p2t.sweep.BasinAngle(n);
        if (angle < p2t.PI_3div4) {
            p2t.sweep.FillBasin(tcx, n);
        }
    }
}

p2t.sweep.BasinAngle = function(node) {
    var ax = node.point.x - node.next.next.point.x;
    var ay = node.point.y - node.next.next.point.y;
    return Math.atan2(ay, ax);
}

/**
 *
 * @param node - middle node
 * @return the angle between 3 front nodes
 */
p2t.sweep.HoleAngle = function(node) {
  /* Complex plane
   * ab = cosA +i*sinA
   * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
   * atan2(y,x) computes the principal value of the argument function
   * applied to the complex number x+iy
   * Where x = ax*bx + ay*by
   *       y = ax*by - ay*bx
   */
  var ax = node.next.point.x - node.point.x;
  var ay = node.next.point.y - node.point.y;
  var bx = node.prev.point.x - node.point.x;
  var by = node.prev.point.y - node.point.y;
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

/**
 * Returns true if triangle was legalized
 */
p2t.sweep.Legalize = function(tcx, t) {
    // To legalize a triangle we start by finding if any of the three edges
    // violate the Delaunay condition
    for (var i=0; i < 3; ++i) {
        if (t.delaunay_edge[i]) continue;

        var ot = t.GetNeighbor(i);
        if (ot != null) {
            var p = t.GetPoint(i);
            var op = ot.OppositePoint(t, p);
            var oi = ot.Index(op);

            // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
            // then we should not try to legalize
            if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
                t.constrained_edge[i] = ot.constrained_edge[oi];
                continue;
            }

            var inside = p2t.sweep.Incircle(p, t.PointCCW(p), t.PointCW(p), op);
            if (inside) {
                // Lets mark this shared edge as Delaunay
                t.delaunay_edge[i] = true;
                ot.delaunay_edge[oi] = true;

                // Lets rotate shared edge one vertex CW to legalize it
                p2t.sweep.RotateTrianglePair(t, p, ot, op);

                // We now got one valid Delaunay Edge shared by two triangles
                // This gives us 4 new edges to check for Delaunay

                // Make sure that triangle to node mapping is done only one time for a specific triangle
                var not_legalized = !p2t.sweep.Legalize(tcx, t);
                if (not_legalized) {
                    tcx.MapTriangleToNodes(t);
                }

                not_legalized = !p2t.sweep.Legalize(tcx, ot);
                if (not_legalized) tcx.MapTriangleToNodes(ot);

                // Reset the Delaunay edges, since they only are valid Delaunay edges
                // until we add a new triangle or point.
                // XXX: need to think about this. Can these edges be tried after we
                //      return to previous recursive level?
                t.delaunay_edge[i] = false;
                ot.delaunay_edge[oi] = false;

                // If triangle have been legalized no need to check the other edges since
                // the recursive legalization will handles those so we can end here.
                return true;
            }
        }
    }
    return false;
}

/**
 * <b>Requirement</b>:<br>
 * 1. a,b and c form a triangle.<br>
 * 2. a and d is know to be on opposite side of bc<br>
 * <pre>
 *                a
 *                +
 *               / \
 *              /   \
 *            b/     \c
 *            +-------+
 *           /    d    \
 *          /           \
 * </pre>
 * <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
 *  a,b and c<br>
 *  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
 *  This preknowledge gives us a way to optimize the incircle test
 * @param pa - triangle point, opposite d
 * @param pb - triangle point
 * @param pc - triangle point
 * @param pd - point opposite a
 * @return true if d is inside circle, false if on circle edge
 */
p2t.sweep.Incircle = function(pa, pb, pc, pd) {
    var adx = pa.x - pd.x;
    var ady = pa.y - pd.y;
    var bdx = pb.x - pd.x;
    var bdy = pb.y - pd.y;

    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;

    if (oabd <= 0) return false;

    var cdx = pc.x - pd.x;
    var cdy = pc.y - pd.y;

    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;

    if (ocad <= 0) return false;

    var bdxcdy = bdx * cdy;
    var cdxbdy = cdx * bdy;

    var alift = adx * adx + ady * ady;
    var blift = bdx * bdx + bdy * bdy;
    var clift = cdx * cdx + cdy * cdy;

    var det = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;
    return det > 0;
}

/**
 * Rotates a triangle pair one vertex CW
 *<pre>
 *       n2                    n2
 *  P +-----+             P +-----+
 *    | t  /|               |\  t |
 *    |   / |               | \   |
 *  n1|  /  |n3           n1|  \  |n3
 *    | /   |    after CW   |   \ |
 *    |/ oT |               | oT \|
 *    +-----+ oP            +-----+
 *       n4                    n4
 * </pre>
 */
p2t.sweep.RotateTrianglePair = function(t, p, ot, op) {
    var n1; var n2; var n3; var n4;
    n1 = t.NeighborCCW(p);
    n2 = t.NeighborCW(p);
    n3 = ot.NeighborCCW(op);
    n4 = ot.NeighborCW(op);

    var ce1; var ce2; var ce3; var ce4;
    ce1 = t.GetConstrainedEdgeCCW(p);
    ce2 = t.GetConstrainedEdgeCW(p);
    ce3 = ot.GetConstrainedEdgeCCW(op);
    ce4 = ot.GetConstrainedEdgeCW(op);

    var de1; var de2; var de3; var de4;
    de1 = t.GetDelaunayEdgeCCW(p);
    de2 = t.GetDelaunayEdgeCW(p);
    de3 = ot.GetDelaunayEdgeCCW(op);
    de4 = ot.GetDelaunayEdgeCW(op);

    t.Legalize(p, op);
    ot.Legalize(op, p);

    // Remap delaunay_edge
    ot.SetDelaunayEdgeCCW(p, de1);
    t.SetDelaunayEdgeCW(p, de2);
    t.SetDelaunayEdgeCCW(op, de3);
    ot.SetDelaunayEdgeCW(op, de4);

    // Remap constrained_edge
    ot.SetConstrainedEdgeCCW(p, ce1);
    t.SetConstrainedEdgeCW(p, ce2);
    t.SetConstrainedEdgeCCW(op, ce3);
    ot.SetConstrainedEdgeCW(op, ce4);

    // Remap neighbors
    // XXX: might optimize the markNeighbor by keeping track of
    //      what side should be assigned to what neighbor after the
    //      rotation. Now mark neighbor does lots of testing to find
    //      the right side.
    t.ClearNeigbors();
    ot.ClearNeigbors();
    if (n1) ot.MarkNeighbor(n1);
    if (n2) t.MarkNeighbor(n2);
    if (n3) t.MarkNeighbor(n3);
    if (n4) ot.MarkNeighbor(n4);
    t.MarkNeighbor(ot);
}

/**
 * Fills a basin that has formed on the Advancing Front to the right
 * of given node.<br>
 * First we decide a left,bottom and right node that forms the
 * boundaries of the basin. Then we do a reqursive fill.
 *
 * @param tcx
 * @param node - starting node, this or next node will be left node
 */
p2t.sweep.FillBasin = function(tcx, node) {
    if (p2t.Orient2d(node.point, node.next.point, node.next.next.point) == p2t.Orientation.CCW) {
        tcx.basin.left_node = node.next.next;
    } else {
        tcx.basin.left_node = node.next;
    }

    // Find the bottom and right node
    tcx.basin.bottom_node = tcx.basin.left_node;
    while (tcx.basin.bottom_node.next != null && tcx.basin.bottom_node.point.y >= tcx.basin.bottom_node.next.point.y) {
        tcx.basin.bottom_node = tcx.basin.bottom_node.next;
    }
    if (tcx.basin.bottom_node == tcx.basin.left_node) {
        // No valid basin
        return;
    }

    tcx.basin.right_node = tcx.basin.bottom_node;
    while (tcx.basin.right_node.next != null && tcx.basin.right_node.point.y < tcx.basin.right_node.next.point.y) {
        tcx.basin.right_node = tcx.basin.right_node.next;
    }
    if (tcx.basin.right_node == tcx.basin.bottom_node) {
        // No valid basins
        return;
    }

    tcx.basin.width = tcx.basin.right_node.point.x - tcx.basin.left_node.point.x;
    tcx.basin.left_highest = tcx.basin.left_node.point.y > tcx.basin.right_node.point.y;

    p2t.sweep.FillBasinReq(tcx, tcx.basin.bottom_node);
}

/**
 * Recursive algorithm to fill a Basin with triangles
 *
 * @param tcx
 * @param node - bottom_node
 */
p2t.sweep.FillBasinReq = function(tcx, node) {
    // if shallow stop filling
    if (p2t.sweep.IsShallow(tcx, node)) {
        return;
    }

    p2t.sweep.Fill(tcx, node);

    var o;
    if (node.prev == tcx.basin.left_node && node.next == tcx.basin.right_node) {
        return;
    } else if (node.prev == tcx.basin.left_node) {
        o = p2t.Orient2d(node.point, node.next.point, node.next.next.point);
        if (o == p2t.Orientation.CW) {
            return;
        }
        node = node.next;
    } else if (node.next == tcx.basin.right_node) {
        o = p2t.Orient2d(node.point, node.prev.point, node.prev.prev.point);
        if (o == p2t.Orientation.CCW) {
            return;
        }
        node = node.prev;
    } else {
        // Continue with the neighbor node with lowest Y value
        if (node.prev.point.y < node.next.point.y) {
            node = node.prev;
        } else {
            node = node.next;
        }
    }

    p2t.sweep.FillBasinReq(tcx, node);
}

p2t.sweep.IsShallow = function(tcx, node) {
    var height;
    if (tcx.basin.left_highest) {
        height = tcx.basin.left_node.point.y - node.point.y;
    } else {
        height = tcx.basin.right_node.point.y - node.point.y;
    }

    // if shallow stop filling
    if (tcx.basin.width > height) {
        return true;
    }
    return false;
}

p2t.sweep.FillEdgeEvent = function(tcx, edge, node) {
    if (tcx.edge_event.right) {
        p2t.sweep.FillRightAboveEdgeEvent(tcx, edge, node);
    } else {
        p2t.sweep.FillLeftAboveEdgeEvent(tcx, edge, node);
    }
}

p2t.sweep.FillRightAboveEdgeEvent = function(tcx, edge, node) {
    while (node.next.point.x < edge.p.x) {
        // Check if next node is below the edge
        if (p2t.Orient2d(edge.q, node.next.point, edge.p) == p2t.Orientation.CCW) {
            p2t.sweep.FillRightBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.next;
        }
    }
}

p2t.sweep.FillRightBelowEdgeEvent = function(tcx, edge, node) {
    if (node.point.x < edge.p.x) {
        if (p2t.Orient2d(node.point, node.next.point, node.next.next.point) == p2t.Orientation.CCW) {
            // Concave
            p2t.sweep.FillRightConcaveEdgeEvent(tcx, edge, node);
        } else{
            // Convex
            p2t.sweep.FillRightConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            p2t.sweep.FillRightBelowEdgeEvent(tcx, edge, node);
        }
    }
}

p2t.sweep.FillRightConcaveEdgeEvent = function(tcx, edge, node) {
    p2t.sweep.Fill(tcx, node.next);
    if (node.next.point != edge.p) {
        // Next above or below edge?
        if (p2t.Orient2d(edge.q, node.next.point, edge.p) == p2t.Orientation.CCW) {
            // Below
            if (p2t.Orient2d(node.point, node.next.point, node.next.next.point) == p2t.Orientation.CCW) {
                // Next is concave
                p2t.sweep.FillRightConcaveEdgeEvent(tcx, edge, node);
            } else {
            // Next is convex
            }
        }
    }
}

p2t.sweep.FillRightConvexEdgeEvent = function(tcx, edge, node) {
    // Next concave or convex?
    if (p2t.Orient2d(node.next.point, node.next.next.point, node.next.next.next.point) == p2t.Orientation.CCW) {
        // Concave
        p2t.sweep.FillRightConcaveEdgeEvent(tcx, edge, node.next);
    } else {
        // Convex
        // Next above or below edge?
        if (p2t.Orient2d(edge.q, node.next.next.point, edge.p) == p2t.Orientation.CCW) {
            // Below
            p2t.sweep.FillRightConvexEdgeEvent(tcx, edge, node.next);
        } else {
            // Above
        }
    }
}

p2t.sweep.FillLeftAboveEdgeEvent = function(tcx, edge, node) {
    while (node.prev.point.x > edge.p.x) {
        // Check if next node is below the edge
        if (p2t.Orient2d(edge.q, node.prev.point, edge.p) == p2t.Orientation.CW) {
            p2t.sweep.FillLeftBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.prev;
        }
    }
}

p2t.sweep.FillLeftBelowEdgeEvent = function(tcx, edge, node) {
    if (node.point.x > edge.p.x) {
        if (p2t.Orient2d(node.point, node.prev.point, node.prev.prev.point) == p2t.Orientation.CW) {
            // Concave
            p2t.sweep.FillLeftConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            p2t.sweep.FillLeftConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            p2t.sweep.FillLeftBelowEdgeEvent(tcx, edge, node);
        }
    }
}

p2t.sweep.FillLeftConvexEdgeEvent = function(tcx, edge, node) {
    // Next concave or convex?
    if (p2t.Orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) == p2t.Orientation.CW) {
        // Concave
        p2t.sweep.FillLeftConcaveEdgeEvent(tcx, edge, node.prev);
    } else {
        // Convex
        // Next above or below edge?
        if (p2t.Orient2d(edge.q, node.prev.prev.point, edge.p) == p2t.Orientation.CW) {
            // Below
            p2t.sweep.FillLeftConvexEdgeEvent(tcx, edge, node.prev);
        } else {
            // Above
        }
    }
}

p2t.sweep.FillLeftConcaveEdgeEvent = function(tcx, edge, node) {
    p2t.sweep.Fill(tcx, node.prev);
    if (node.prev.point != edge.p) {
        // Next above or below edge?
        if (p2t.Orient2d(edge.q, node.prev.point, edge.p) == p2t.Orientation.CW) {
            // Below
            if (p2t.Orient2d(node.point, node.prev.point, node.prev.prev.point) == p2t.Orientation.CW) {
                // Next is concave
                p2t.sweep.FillLeftConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
            }
        }
    }
}

p2t.sweep.FlipEdgeEvent = function(tcx, ep, eq, t, p) {
    var ot = t.NeighborAcross(p);
    if (ot == null) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        alert('[BUG:FIXME] FLIP failed due to missing triangle!');
        return;
    }
    var op = ot.OppositePoint(t, p);

    if (p2t.InScanArea(p, t.PointCCW(p), t.PointCW(p), op)) {
        // Lets rotate shared edge one vertex CW
        p2t.sweep.RotateTrianglePair(t, p, ot, op);
        tcx.MapTriangleToNodes(t);
        tcx.MapTriangleToNodes(ot);

        if (p == eq && op == ep) {
            if (eq == tcx.edge_event.constrained_edge.q && ep == tcx.edge_event.constrained_edge.p) {
                t.MarkConstrainedEdge(ep, eq);
                ot.MarkConstrainedEdge(ep, eq);
                p2t.sweep.Legalize(tcx, t);
                p2t.sweep.Legalize(tcx, ot);
            } else {
                // XXX: I think one of the triangles should be legalized here?
            }
        } else {
            var o = p2t.Orient2d(eq, op, ep);
            t = p2t.sweep.NextFlipTriangle(tcx, o, t, ot, p, op);
            p2t.sweep.FlipEdgeEvent(tcx, ep, eq, t, p);
        }
    } else {
        var newP = p2t.sweep.NextFlipPoint(ep, eq, ot, op);
        p2t.sweep.FlipScanEdgeEvent(tcx, ep, eq, t, ot, newP);
        p2t.sweep.EdgeEvent(tcx, ep, eq, t, p);
    }
}

p2t.sweep.NextFlipTriangle = function(tcx, o, t, ot, p, op) {
    var edge_index;
    if (o == p2t.Orientation.CCW) {
        // ot is not crossing edge after flip
        edge_index = ot.EdgeIndex(p, op);
        ot.delaunay_edge[edge_index] = true;
        p2t.sweep.Legalize(tcx, ot);
        ot.ClearDelunayEdges();
        return t;
    }

    // t is not crossing edge after flip
    edge_index = t.EdgeIndex(p, op);

    t.delaunay_edge[edge_index] = true;
    p2t.sweep.Legalize(tcx, t);
    t.ClearDelunayEdges();
    return ot;
}

p2t.sweep.NextFlipPoint = function(ep, eq, ot, op) {
    var o2d = p2t.Orient2d(eq, op, ep);
    if (o2d == p2t.Orientation.CW) {
        // Right
        return ot.PointCCW(op);
    } else if (o2d == p2t.Orientation.CCW) {
        // Left
        return ot.PointCW(op);
    } else {
        alert("[Unsupported] p2t.sweep.NextFlipPoint: opposing point on constrained edge!");
        return undefined;
    }
}

p2t.sweep.FlipScanEdgeEvent = function(tcx, ep, eq, flip_triangle, t, p) {
    var ot = t.NeighborAcross(p);

    if (ot == null) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        alert('[BUG:FIXME] FLIP failed due to missing triangle');
        return;
    }
    var op = ot.OppositePoint(t, p);

    if (p2t.InScanArea(eq, flip_triangle.PointCCW(eq), flip_triangle.PointCW(eq), op)) {
        // flip with new edge op.eq
        p2t.sweep.FlipEdgeEvent(tcx, eq, op, ot, op);
        // TODO: Actually I just figured out that it should be possible to
        //       improve this by getting the next ot and op before the the above
        //       flip and continue the flipScanEdgeEvent here
        // set new ot and op here and loop back to inScanArea test
        // also need to set a new flip_triangle first
        // Turns out at first glance that this is somewhat complicated
        // so it will have to wait.
    } else {
        var newP = p2t.sweep.NextFlipPoint(ep, eq, ot, op);
        p2t.sweep.FlipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
    }
}

// -----------------------------------------------------------------------------
//Namespace.provide('p2t');
//Namespace.provide('p2t.sweep');
