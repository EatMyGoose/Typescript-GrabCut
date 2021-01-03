"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("Utility", ["require", "exports", "Collections"], function (require, exports, Collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UniqueRandom = exports.Fill2DRect = exports.HashItems = exports.Sum = exports.Max = exports.Swap = exports.Zip = exports.Fill2DObj = exports.FillObj = exports.Memset = exports.Fill = exports.PerfectlyDivisible = void 0;
    function PerfectlyDivisible(val, divisor) {
        var div = val / divisor;
        return Math.floor(val) == val;
    }
    exports.PerfectlyDivisible = PerfectlyDivisible;
    function Fill(length, value) {
        var arr = new Array(length);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = value;
        }
        return arr;
    }
    exports.Fill = Fill;
    function Memset(arr, value) {
        for (var i = 0; i < arr.length; i++) {
            arr[i] = value;
        }
    }
    exports.Memset = Memset;
    function FillObj(length, generator) {
        var arr = new Array(length);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = generator();
        }
        return arr;
    }
    exports.FillObj = FillObj;
    function Fill2DObj(rows, cols, generator) {
        var arr = new Array(rows);
        for (var r = 0; r < rows; r++) {
            var newRow = new Array(cols);
            for (var c = 0; c < cols; c++) {
                newRow[c] = generator();
            }
            arr[r] = newRow;
        }
        return arr;
    }
    exports.Fill2DObj = Fill2DObj;
    function Zip(arr1, arr2, fn) {
        if (arr1.length != arr2.length) {
            throw new Error("Zip: arrays of different length: 1st: " + arr1.length + "  2nd: " + arr2.length);
        }
        var result = new Array(arr1.length);
        for (var i = 0; i < result.length; i++) {
            result[0] = fn(arr1[i], arr2[i]);
        }
        return result;
    }
    exports.Zip = Zip;
    function Swap(arr, ind1, ind2) {
        var temp = arr[ind1];
        arr[ind1] = arr[ind2];
        arr[ind2] = temp;
    }
    exports.Swap = Swap;
    function Max(arr) {
        var max = arr[0];
        for (var i = 0; i < arr.length; i++) {
            max = Math.max(max, arr[i]);
        }
        return max;
    }
    exports.Max = Max;
    function Sum(arr) {
        var acc = 0;
        for (var i = 0; i < arr.length; i++) {
            acc += arr[i];
        }
        return acc;
    }
    exports.Sum = Sum;
    function HashItems(list, keyGenerator) {
        var dict = new Collections_1.Dictionary();
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var key = keyGenerator(item);
            if (!dict.ContainsKey(key)) {
                dict.Set(key, item);
            }
        }
        return dict;
    }
    exports.HashItems = HashItems;
    function Fill2DRect(arr, value, x, y, width, height) {
        var right = x + width;
        var bot = y + height;
        for (var r = y; r < bot; r++) {
            for (var c = x; c < right; c++) {
                arr[r][c] = value;
            }
        }
    }
    exports.Fill2DRect = Fill2DRect;
    function UniqueRandom(nNumbers, upperInclusive) {
        if (nNumbers > upperInclusive)
            throw new Error('UniqueRandom: nNumbers must be smaller than upperInclusive');
        var dict = new Collections_1.Dictionary();
        var selected = [];
        while (selected.length < nNumbers) {
            var rand = Math.floor(Math.random() * upperInclusive);
            if (!dict.ContainsKey(rand)) {
                selected.push(rand);
                dict.Set(rand, true);
            }
        }
        return selected;
    }
    exports.UniqueRandom = UniqueRandom;
});
define("Collections", ["require", "exports", "Utility"], function (require, exports, Util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisitedArray = exports.Dictionary = exports.LabelledCircularQueue = exports.CircularBufferQueue = exports.DoubleStackQueue = void 0;
    var DoubleStackQueue = (function () {
        function DoubleStackQueue() {
            this.incoming = [];
            this.outgoing = [];
            this.size = 0;
        }
        DoubleStackQueue.prototype.Shift = function () {
            while (this.incoming.length > 0) {
                var last = this.incoming.pop();
                this.outgoing.push(last);
            }
        };
        DoubleStackQueue.prototype.Enqueue = function (value) {
            this.size += 1;
            this.incoming.push(value);
        };
        DoubleStackQueue.prototype.Peek = function () {
            if (this.outgoing.length == 0) {
                this.Shift();
            }
            return this.outgoing[this.outgoing.length - 1];
        };
        DoubleStackQueue.prototype.Dequeue = function () {
            if (this.outgoing.length == 0) {
                this.Shift();
            }
            this.size -= 1;
            return this.outgoing.pop();
        };
        DoubleStackQueue.prototype.Count = function () {
            return this.size;
        };
        return DoubleStackQueue;
    }());
    exports.DoubleStackQueue = DoubleStackQueue;
    var CircularBufferQueue = (function () {
        function CircularBufferQueue(initialSize) {
            if (initialSize === void 0) { initialSize = 32; }
            this.head = 0;
            this.tail = 0;
            this.count = 0;
            this.buffer = new Array(initialSize);
        }
        CircularBufferQueue.prototype.Resize = function (currentSize, newSize) {
            var resized = new Array(newSize);
            for (var i = 0; i < currentSize; i++) {
                var ind = (this.tail + i) % currentSize;
                resized[i] = this.buffer[ind];
            }
            this.buffer = resized;
            this.tail = 0;
            this.head = this.count;
        };
        CircularBufferQueue.prototype.Enqueue = function (value) {
            this.count++;
            this.buffer[this.head] = value;
            this.head = (this.head + 1);
            if (this.head >= this.buffer.length) {
                this.head = 0;
            }
            if (this.head == this.tail) {
                this.Resize(this.buffer.length, this.buffer.length * 2);
            }
        };
        CircularBufferQueue.prototype.Peek = function () {
            return this.buffer[this.tail];
        };
        CircularBufferQueue.prototype.Dequeue = function () {
            this.count -= 1;
            var element = this.buffer[this.tail];
            this.tail++;
            if (this.tail >= this.buffer.length) {
                this.tail = 0;
            }
            return element;
        };
        CircularBufferQueue.prototype.Count = function () {
            return this.count;
        };
        return CircularBufferQueue;
    }());
    exports.CircularBufferQueue = CircularBufferQueue;
    var LabelledCircularQueue = (function (_super) {
        __extends(LabelledCircularQueue, _super);
        function LabelledCircularQueue(initialSize) {
            if (initialSize === void 0) { initialSize = 32; }
            var _this = _super.call(this, initialSize) || this;
            _this.skip = Util.Fill(initialSize, false);
            _this.indices = new Dictionary();
            return _this;
        }
        LabelledCircularQueue.prototype.ResizeBuffers = function (currentSize, newSize) {
            var resizedSkip = new Array(newSize);
            var resizedBuffer = new Array(newSize);
            var newDict = new Dictionary();
            var destInd = 0;
            for (var i = 0; i < currentSize; i++) {
                var ind = (this.tail + i) % currentSize;
                if (this.skip[ind])
                    continue;
                var currentValue = this.buffer[ind];
                resizedBuffer[destInd] = currentValue;
                resizedSkip[destInd] = false;
                newDict.Set(currentValue, destInd);
                destInd++;
            }
            this.indices = newDict;
            this.buffer = resizedBuffer;
            this.skip = resizedSkip;
            this.tail = 0;
            this.head = this.count;
        };
        LabelledCircularQueue.prototype.Contains = function (value) {
            return this.indices.ContainsKey(value);
        };
        LabelledCircularQueue.prototype.Remove = function (value) {
            this.count--;
            var ind = this.indices.Get(value);
            if (!this.indices.ContainsKey(value)) {
                throw new Error("queue does not contain element " + value);
            }
            this.indices.Remove(value);
            this.skip[ind] = true;
        };
        LabelledCircularQueue.prototype.Enqueue = function (value) {
            this.count++;
            this.skip[this.head] = false;
            this.buffer[this.head] = value;
            if (this.indices.ContainsKey(value)) {
                throw new Error("Queue contains duplicate " + value);
            }
            this.indices.Set(value, this.head);
            this.head++;
            if (this.head >= this.buffer.length) {
                this.head = 0;
            }
            if (this.head == this.tail) {
                this.ResizeBuffers(this.buffer.length, this.buffer.length * 2);
            }
        };
        LabelledCircularQueue.prototype.MoveToValid = function () {
            while (this.skip[this.tail]) {
                this.tail = (this.tail + 1) % this.skip.length;
            }
        };
        LabelledCircularQueue.prototype.Peek = function () {
            this.MoveToValid();
            return _super.prototype.Peek.call(this);
        };
        LabelledCircularQueue.prototype.Dequeue = function () {
            this.MoveToValid();
            var dequeued = _super.prototype.Dequeue.call(this);
            if (!this.indices.ContainsKey(dequeued)) {
                throw new Error("queue does not contain element " + dequeued);
            }
            this.indices.Remove(dequeued);
            return dequeued;
        };
        return LabelledCircularQueue;
    }(CircularBufferQueue));
    exports.LabelledCircularQueue = LabelledCircularQueue;
    var Dictionary = (function () {
        function Dictionary() {
            this.hashtable = {};
        }
        Dictionary.prototype.ContainsKey = function (key) {
            return this.hashtable.hasOwnProperty(key);
        };
        Dictionary.prototype.Remove = function (key) {
            delete this.hashtable[key];
        };
        Dictionary.prototype.Get = function (key) {
            return this.hashtable[key];
        };
        Dictionary.prototype.Set = function (key, value) {
            this.hashtable[key] = value;
        };
        return Dictionary;
    }());
    exports.Dictionary = Dictionary;
    var VisitedArray = (function () {
        function VisitedArray(size) {
            this.visited = Util.Fill(size, -1);
            this.token = 0;
        }
        VisitedArray.prototype.UpdateToken = function () {
            var threshold = 2147483647;
            if (this.token >= threshold) {
                this.token = 1;
                Util.Memset(this.visited, 0);
            }
            this.token += 1;
            return [this.visited, this.token];
        };
        return VisitedArray;
    }());
    exports.VisitedArray = VisitedArray;
});
define("FlowNetworkSolver", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("BKGraph", ["require", "exports", "Collections", "Utility"], function (require, exports, DS, Util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BKMaxflow = exports.BKNetwork = exports.TreeFlag = void 0;
    var TreeFlag;
    (function (TreeFlag) {
        TreeFlag[TreeFlag["Free"] = 0] = "Free";
        TreeFlag[TreeFlag["S"] = 1] = "S";
        TreeFlag[TreeFlag["T"] = 2] = "T";
    })(TreeFlag = exports.TreeFlag || (exports.TreeFlag = {}));
    var BKEdge = (function () {
        function BKEdge(from, to, capacity, index) {
            this.cap = capacity;
            this.flow = 0;
            this.to = to;
            this.from = from;
            this.ind = index;
        }
        return BKEdge;
    }());
    var BKNode = (function () {
        function BKNode() {
            this.edgesOut = [];
            this.edgesIn = [];
        }
        return BKNode;
    }());
    var BKNetwork = (function () {
        function BKNetwork() {
            this.nodes = [];
            this.edges = [];
            this.edgeList = [];
        }
        BKNetwork.prototype.CreateNode = function () {
            var ind = this.nodes.length;
            this.nodes.push(new BKNode());
            this.edgeList.push(new DS.Dictionary());
            return ind;
        };
        BKNetwork.prototype.CreateEdge = function (source, dest, capacity) {
            if (isNaN(capacity))
                throw new Error("capacity cannot be NaN");
            var edgeInd = this.edges.length;
            var edge = new BKEdge(source, dest, capacity, edgeInd);
            this.edges.push(edge);
            this.nodes[source].edgesOut.push(edge);
            this.nodes[dest].edgesIn.push(edge);
            this.edgeList[source].Set(dest, edge);
            return edgeInd;
        };
        BKNetwork.prototype.UpdateEdge = function (srcIndex, destInd, newCap) {
            var targetEdge = this.edgeList[srcIndex].Get(destInd);
            targetEdge.cap = newCap;
        };
        BKNetwork.prototype.ResetFlow = function () {
            var edges = this.edges;
            for (var i = 0; i < edges.length; i++) {
                edges[i].flow = 0;
            }
        };
        BKNetwork.prototype.Clone = function () {
            var clone = new BKNetwork();
            for (var i = 0; i < this.nodes.length; i++)
                clone.CreateNode();
            var oE = this.edges;
            for (var i = 0; i < oE.length; i++) {
                var oEdge = oE[i];
                var cEdgeInd = clone.CreateEdge(oEdge.from, oEdge.to, oEdge.cap);
                var cEdge = clone.edges[cEdgeInd];
                cEdge.flow = oEdge.flow;
            }
            return clone;
        };
        return BKNetwork;
    }());
    exports.BKNetwork = BKNetwork;
    var NULL_PARENT = -1;
    function BKGrow(nodes, active, flags, parents, edgeToParent, activeEdge) {
        while (active.Count() > 0) {
            var nInd = active.Peek();
            var group = flags[nInd];
            var n = nodes[nInd];
            if (group == TreeFlag.S) {
                var edgesOut = n.edgesOut;
                for (var i = activeEdge[nInd]; i < edgesOut.length; i++) {
                    var e = edgesOut[i];
                    if (e.flow >= e.cap)
                        continue;
                    var destNodeInd = e.to;
                    if (flags[destNodeInd] == TreeFlag.T) {
                        return e;
                    }
                    else if (flags[destNodeInd] == TreeFlag.Free) {
                        flags[destNodeInd] = group;
                        parents[destNodeInd] = nInd;
                        edgeToParent[destNodeInd] = e;
                        active.Enqueue(destNodeInd);
                    }
                    activeEdge[nInd] = i;
                }
            }
            else {
                var edgesIn = n.edgesIn;
                for (var i = activeEdge[nInd]; i < edgesIn.length; i++) {
                    var e = edgesIn[i];
                    if (e.flow >= e.cap)
                        continue;
                    var destNodeInd = e.from;
                    if (flags[destNodeInd] == TreeFlag.S) {
                        return e;
                    }
                    else if (flags[destNodeInd] == TreeFlag.Free) {
                        flags[destNodeInd] = group;
                        parents[destNodeInd] = nInd;
                        edgeToParent[destNodeInd] = e;
                        active.Enqueue(destNodeInd);
                    }
                    activeEdge[nInd] = i;
                }
            }
            active.Dequeue();
            activeEdge[nInd] = 0;
        }
        return null;
    }
    function BKBottleneck(src, sink, connector, edgeToParent) {
        var bottleneck = connector.cap - connector.flow;
        {
            var walkS = connector.from;
            while (walkS != src) {
                var edge = edgeToParent[walkS];
                bottleneck = Math.min(bottleneck, edge.cap - edge.flow);
                walkS = edge.from;
            }
        }
        {
            var walkT = connector.to;
            while (walkT != sink) {
                var edge = edgeToParent[walkT];
                bottleneck = Math.min(bottleneck, edge.cap - edge.flow);
                walkT = edge.to;
            }
        }
        return bottleneck;
    }
    function BKAugment(bottleneck, src, sink, connector, edgeToParent, orphanSet, parents) {
        connector.flow += bottleneck;
        {
            var walkS = connector.from;
            while (walkS != src) {
                var edge = edgeToParent[walkS];
                edge.flow += bottleneck;
                if (edge.cap <= edge.flow) {
                    parents[walkS] = NULL_PARENT;
                    orphanSet.push(walkS);
                }
                walkS = edge.from;
            }
        }
        {
            var walkT = connector.to;
            while (walkT != sink) {
                var edge = edgeToParent[walkT];
                edge.flow += bottleneck;
                if (edge.cap <= edge.flow) {
                    parents[walkT] = NULL_PARENT;
                    orphanSet.push(walkT);
                }
                walkT = edge.to;
            }
        }
    }
    function LinkedToSource(nodeInd, srcInd, parents, edgeToParent) {
        var walkS = nodeInd;
        while (walkS != srcInd) {
            if (parents[walkS] == NULL_PARENT)
                return false;
            var edge = edgeToParent[walkS];
            walkS = edge.from;
        }
        return true;
    }
    function LinkedToSink(nodeInd, sinkInd, parents, edgeToParent) {
        var walkT = nodeInd;
        while (walkT != sinkInd) {
            if (parents[walkT] == NULL_PARENT)
                return false;
            var edge = edgeToParent[walkT];
            walkT = edge.to;
        }
        return true;
    }
    function BKAdopt(nodes, orphanSet, flags, parents, edgeToParent, activeSet, src, sink) {
        while (orphanSet.length > 0) {
            var ind = orphanSet.pop();
            var orphanNode = nodes[ind];
            var group = flags[ind];
            var isSourceTree = group == TreeFlag.S;
            var parentFound = false;
            {
                var edges = (isSourceTree) ? orphanNode.edgesIn : orphanNode.edgesOut;
                for (var i = 0; i < edges.length; i++) {
                    var e = edges[i];
                    var parentInd = (isSourceTree) ? e.from : e.to;
                    var unsaturated = e.cap > e.flow;
                    var sameGroup = flags[parentInd] == group;
                    if (unsaturated && sameGroup) {
                        var linkedToSource = (isSourceTree) ?
                            LinkedToSource(e.from, src, parents, edgeToParent) :
                            LinkedToSink(e.to, sink, parents, edgeToParent);
                        if (linkedToSource) {
                            parentFound = true;
                            parents[ind] = parentInd;
                            edgeToParent[ind] = e;
                            break;
                        }
                    }
                }
            }
            if (parentFound)
                continue;
            {
                if (isSourceTree) {
                    var edgesIn = orphanNode.edgesIn;
                    for (var i = 0; i < edgesIn.length; i++) {
                        var e = edgesIn[i];
                        if (e.flow < e.cap && flags[e.from] == group) {
                            if (!activeSet.Contains(e.from)) {
                                activeSet.Enqueue(e.from);
                            }
                        }
                    }
                    var edgesOut = orphanNode.edgesOut;
                    for (var i = 0; i < edgesOut.length; i++) {
                        var e = edgesOut[i];
                        if (flags[e.to] == group && parents[e.to] == ind) {
                            orphanSet.push(e.to);
                            parents[e.to] = NULL_PARENT;
                        }
                    }
                }
                else {
                    var edgesOut = orphanNode.edgesOut;
                    for (var i = 0; i < edgesOut.length; i++) {
                        var e = edgesOut[i];
                        if (e.flow < e.cap && flags[e.to] == group) {
                            if (!activeSet.Contains(e.to)) {
                                activeSet.Enqueue(e.to);
                            }
                        }
                    }
                    var edgesIn = orphanNode.edgesIn;
                    for (var i = 0; i < edgesIn.length; i++) {
                        var e = edgesIn[i];
                        if (flags[e.from] == group && parents[e.from] == ind) {
                            orphanSet.push(e.from);
                            parents[e.from] = NULL_PARENT;
                        }
                    }
                }
            }
            flags[ind] = TreeFlag.Free;
            if (activeSet.Contains(ind)) {
                activeSet.Remove(ind);
            }
        }
    }
    exports.BKMaxflow = function (src, sink, network) {
        var nodes = network.nodes;
        var active = new DS.LabelledCircularQueue();
        var activeEdge = Util.Fill(nodes.length, 0);
        var flags = new Uint8Array(nodes.length);
        var parents = Util.Fill(nodes.length, NULL_PARENT);
        var edgeToParent = Util.Fill(nodes.length, null);
        var orphans = [];
        active.Enqueue(src);
        active.Enqueue(sink);
        flags[src] = TreeFlag.S;
        flags[sink] = TreeFlag.T;
        while (true) {
            var connector = BKGrow(nodes, active, flags, parents, edgeToParent, activeEdge);
            if (connector == null)
                break;
            var min = BKBottleneck(src, sink, connector, edgeToParent);
            BKAugment(min, src, sink, connector, edgeToParent, orphans, parents);
            BKAdopt(nodes, orphans, flags, parents, edgeToParent, active, src, sink);
        }
        var sourceOutflux = function () { return Util.Sum(nodes[src].edgesOut.map(function (e) { return e.flow; })); };
        var STreeIndices = function () {
            return Array.from(flags)
                .map(function (f, ind) { return [f, ind]; })
                .filter(function (t) { return t[0] == TreeFlag.S; })
                .map(function (t) { return t[1]; });
        };
        return {
            GetMaxFlow: sourceOutflux,
            GetSourcePartition: STreeIndices
        };
    };
});
define("Matrix", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IsVector = exports.IsRowVector = exports.IsColumnVector = exports.MaxElement = exports.Inverse = exports.Cofactors = exports.SubMatrix = exports.Determinant = exports.MeanAndCovariance = exports.AddScalar = exports.Sub = exports.AddInPlace = exports.Add = exports.Scale = exports.Transpose = exports.Mul = exports.FromArray = exports.IsSquare = exports.Dimensions = exports.NormSquare = exports.Identity = exports.Norm = exports.CreateMatrix = exports.Columns = exports.Rows = exports.RandomFill = exports.OfDimensions = exports.Clone = exports.Print = void 0;
    function Print(m) {
        var lines = m.map(function (r) { return "[" + r.join(',') + "]"; });
        return "[" + lines.join('\n') + "]";
    }
    exports.Print = Print;
    function Clone(m) {
        var _a = Dimensions(m), nRows = _a[0], nCols = _a[1];
        var rows = new Array(nRows);
        for (var r = 0; r < nRows; r++) {
            rows[r] = m[r].slice(0);
        }
        return FromArray(rows);
    }
    exports.Clone = Clone;
    function OfDimensions(m, nRows, nCols) {
        return m.length == nRows && m[0].length == nCols;
    }
    exports.OfDimensions = OfDimensions;
    function RandomFill(lowerBound, upperBound) {
        var _a = Dimensions(lowerBound), nRows = _a[0], nCols = _a[1];
        var random = CreateMatrix(nRows, nCols);
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                var lower = lowerBound[r][c];
                var upper = upperBound[r][c];
                random[r][c] = Math.random() * (upper - lower) + lower;
            }
        }
        return random;
    }
    exports.RandomFill = RandomFill;
    function Rows(m) {
        return m.length;
    }
    exports.Rows = Rows;
    function Columns(m) {
        return m[0].length;
    }
    exports.Columns = Columns;
    function CreateMatrix(rows, columns) {
        var mat = new Array(rows);
        for (var r = 0; r < rows; r++) {
            var newRow = new Array(columns);
            for (var c = 0; c < columns; c++) {
                newRow[c] = 0;
            }
            mat[r] = newRow;
        }
        return mat;
    }
    exports.CreateMatrix = CreateMatrix;
    function Norm(m) {
        var _a = Dimensions(m), rows = _a[0], cols = _a[1];
        var nElems = rows * cols;
        var acc = 0;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                acc += m[r][c] * m[r][c];
            }
        }
        return Math.pow(acc, 1 / nElems);
    }
    exports.Norm = Norm;
    function Identity(side) {
        var id = CreateMatrix(side, side);
        for (var i = 0; i < side; i++) {
            id[i][i] = 1;
        }
        return id;
    }
    exports.Identity = Identity;
    function NormSquare(m) {
        var _a = Dimensions(m), rows = _a[0], cols = _a[1];
        var acc = 0;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                acc += m[r][c] * m[r][c];
            }
        }
        return acc;
    }
    exports.NormSquare = NormSquare;
    function Dimensions(m) {
        return [Rows(m), Columns(m)];
    }
    exports.Dimensions = Dimensions;
    function IsSquare(m) {
        return Rows(m) == Columns(m);
    }
    exports.IsSquare = IsSquare;
    function FromArray(arr) {
        return arr;
    }
    exports.FromArray = FromArray;
    function Mul(m1, m2) {
        var _a = [m1.length, m2[0].length], nRows = _a[0], nCols = _a[1];
        var product = CreateMatrix(nRows, nCols);
        var len = m1[0].length;
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                var acc = 0;
                for (var i = 0; i < len; i++) {
                    acc += m1[r][i] * m2[i][c];
                }
                product[r][c] = acc;
            }
        }
        return product;
    }
    exports.Mul = Mul;
    function Transpose(m1) {
        var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
        var transposed = CreateMatrix(nCols, nRows);
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                transposed[c][r] = m1[r][c];
            }
        }
        return transposed;
    }
    exports.Transpose = Transpose;
    function Scale(scalar, m1) {
        var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
        var scaled = CreateMatrix(nRows, nCols);
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                scaled[r][c] = scalar * m1[r][c];
            }
        }
        return scaled;
    }
    exports.Scale = Scale;
    function Add(m1, m2) {
        var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
        var sum = CreateMatrix(nRows, nCols);
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                sum[r][c] = m1[r][c] + m2[r][c];
            }
        }
        return sum;
    }
    exports.Add = Add;
    function AddInPlace(acc, add) {
        var _a = Dimensions(acc), nRows = _a[0], nCols = _a[1];
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                acc[r][c] += add[r][c];
            }
        }
    }
    exports.AddInPlace = AddInPlace;
    function Sub(m1, m2) {
        var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
        var sum = CreateMatrix(nRows, nCols);
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                sum[r][c] = m1[r][c] - m2[r][c];
            }
        }
        return sum;
    }
    exports.Sub = Sub;
    function AddScalar(scalar, m1) {
        var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
        var result = CreateMatrix(nRows, nCols);
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                result[r][c] = m1[r][c] + scalar;
            }
        }
        return result;
    }
    exports.AddScalar = AddScalar;
    function MeanAndCovariance(data) {
        if (!IsVector(data[0]))
            throw Error("MeanAndCovariance: Vector input required");
        var _a = Dimensions(data[0]), nRows = _a[0], nCols = _a[1];
        var nData = data.length;
        var meanAcc = CreateMatrix(nRows, nCols);
        for (var i = 0; i < data.length; i++) {
            AddInPlace(meanAcc, data[i]);
        }
        var mean = Scale(1 / nData, meanAcc);
        var side = Math.max(nRows, nCols);
        var covAcc = CreateMatrix(side, side);
        for (var i = 0; i < data.length; i++) {
            var diff = Sub(data[i], mean);
            var diffTransposed = Transpose(diff);
            var add = Mul(diff, diffTransposed);
            AddInPlace(covAcc, add);
        }
        var covariance = Scale(1 / nData, covAcc);
        return { mean: mean, covariance: covariance };
    }
    exports.MeanAndCovariance = MeanAndCovariance;
    function Determinant(m) {
        var square = IsSquare(m);
        if (!square) {
            var _a = Dimensions(m), nRows = _a[0], nCols = _a[1];
            throw new Error("Determinant: parameter is a non square matrix - rows:" + nRows + " colums:" + nCols);
        }
        var size = Rows(m);
        switch (size) {
            case 1: {
                return m[0][0];
            }
            case 2: {
                return m[0][0] * m[1][1] - m[0][1] * m[1][0];
            }
            case 3: {
                var det1 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
                var det2 = m[1][0] * m[2][2] - m[1][2] * m[2][0];
                var det3 = m[1][0] * m[2][1] - m[1][1] * m[2][0];
                return m[0][0] * det1 - m[0][1] * det2 + m[0][2] * det3;
            }
            default: {
                var acc = 0;
                var even = true;
                for (var i = 0; i < size; i++) {
                    var minor = SubMatrix(m, 0, i);
                    acc += (even ? 1 : -1) * m[0][i] * Determinant(minor);
                    even = !even;
                }
                return acc;
            }
        }
    }
    exports.Determinant = Determinant;
    function SubMatrix(m1, row, col) {
        var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
        var sub = [];
        for (var r = 0; r < nRows; r++) {
            if (r == row)
                continue;
            var newRow = [];
            for (var c = 0; c < nCols; c++) {
                if (c == col)
                    continue;
                newRow.push(m1[r][c]);
            }
            sub.push(newRow);
        }
        return FromArray(sub);
    }
    exports.SubMatrix = SubMatrix;
    function Cofactors(m1) {
        var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
        var minors = CreateMatrix(nRows, nCols);
        for (var r = 0; r < nRows; r++) {
            var even = ((r & 1) == 0);
            for (var c = 0; c < nCols; c++) {
                var sub = SubMatrix(m1, r, c);
                var sign = even ? 1 : -1;
                even = !even;
                minors[r][c] = sign * Determinant(sub);
            }
        }
        return minors;
    }
    exports.Cofactors = Cofactors;
    function Inverse(m1) {
        var square = IsSquare(m1);
        if (!square) {
            var _a = Dimensions(m1), nRows = _a[0], nCols = _a[1];
            throw new Error("Matrix Inverse: parameter is a non square matrix - rows:" + nRows + " colums:" + nCols);
        }
        var size = Rows(m1);
        if (size == 1) {
            var adjugate_1 = CreateMatrix(1, 1);
            adjugate_1[0][0] = 1.0 / m1[0][0];
            return adjugate_1;
        }
        var det = Determinant(m1);
        var cofactors = Cofactors(m1);
        var adjugate = Transpose(cofactors);
        return Scale(1.0 / det, adjugate);
    }
    exports.Inverse = Inverse;
    function MaxElement(m) {
        var _a = Dimensions(m), nRows = _a[0], nCols = _a[1];
        var max = m[0][0];
        for (var r = 0; r < nRows; r++) {
            for (var c = 0; c < nCols; c++) {
                max = Math.max(max, m[r][c]);
            }
        }
        return max;
    }
    exports.MaxElement = MaxElement;
    function IsColumnVector(m) {
        var _a = Dimensions(m), nRows = _a[0], nCols = _a[1];
        return nCols == 1;
    }
    exports.IsColumnVector = IsColumnVector;
    function IsRowVector(m) {
        var _a = Dimensions(m), nRows = _a[0], nCols = _a[1];
        return nRows == 1;
    }
    exports.IsRowVector = IsRowVector;
    function IsVector(m) {
        return IsColumnVector(m) || IsRowVector(m);
    }
    exports.IsVector = IsVector;
});
define("ClusterGenerator", ["require", "exports", "Utility", "Matrix"], function (require, exports, Util, Mat) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UniformClusters = void 0;
    function UniformClusters(mean, spread, nPoints) {
        var lower = Mat.Scale(-1, spread);
        var upper = spread;
        var points = Util.FillObj(nPoints, function () { return Mat.Clone(mean); });
        for (var i = 0; i < nPoints; i++) {
            var randomOffsets = Mat.RandomFill(lower, upper);
            Mat.AddInPlace(points[i], randomOffsets);
        }
        return points;
    }
    exports.UniformClusters = UniformClusters;
});
define("ConvergenceChecker", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConvergenceChecker = void 0;
    var ConvergenceChecker = (function () {
        function ConvergenceChecker(minPercentChange, maxIter) {
            this.maxIter = 0;
            this.iterCount = 0;
            this.lastObjFnValue = null;
            this.minChange = 1;
            this.maxIter = maxIter;
            this.minChange = minPercentChange / 100;
        }
        ConvergenceChecker.prototype.hasConverged = function (objFnValue, iter) {
            if (iter === void 0) { iter = -1; }
            this.iterCount = (iter < 0) ? this.iterCount + 1 : iter;
            if (this.iterCount >= this.maxIter)
                return true;
            if (this.lastObjFnValue == null) {
                this.lastObjFnValue = objFnValue;
                return false;
            }
            else {
                var diff = Math.abs(objFnValue - this.lastObjFnValue);
                var denominator = Math.abs(objFnValue);
                this.lastObjFnValue = objFnValue;
                if (denominator == 0)
                    return false;
                var fractionalChange = (diff / denominator);
                return fractionalChange < this.minChange;
            }
        };
        ConvergenceChecker.prototype.getCurrentIter = function () {
            return this.iterCount;
        };
        return ConvergenceChecker;
    }());
    exports.ConvergenceChecker = ConvergenceChecker;
});
define("DinicFlowSolver", ["require", "exports", "Utility", "Collections"], function (require, exports, Util, DS) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DinicSolver = exports.MinCut = exports.DinicMaxFlow = exports.DinicNetwork = exports.GraphNode = exports.Edge = void 0;
    var Edge = (function () {
        function Edge(_src, _sink, _cap, _id) {
            this.sink = _sink;
            this.source = _src;
            this.capacity = _cap;
            this.flow = 0;
            this.id = _id;
        }
        return Edge;
    }());
    exports.Edge = Edge;
    var GraphNode = (function () {
        function GraphNode(_id) {
            this.id = _id;
            this.edges = [];
        }
        return GraphNode;
    }());
    exports.GraphNode = GraphNode;
    var DinicNetwork = (function () {
        function DinicNetwork() {
            this.edgeMap = [];
            this.nodeList = [];
            this.edgeList = [];
        }
        DinicNetwork.prototype.CreateNode = function () {
            var count = this.nodeList.length;
            this.nodeList.push(new GraphNode(count));
            this.edgeMap.push(new DS.Dictionary());
            return count;
        };
        DinicNetwork.prototype.CreateEdge = function (source, sink, capacity) {
            var count = this.edgeList.length;
            var newEdge = new Edge(source, sink, capacity, count);
            var residualEdge = new Edge(sink, source, 0, count + 1);
            newEdge.reverse = residualEdge.id;
            residualEdge.reverse = newEdge.id;
            this.nodeList[source].edges.push(newEdge);
            this.nodeList[sink].edges.push(residualEdge);
            this.edgeList.push(newEdge);
            this.edgeList.push(residualEdge);
            this.edgeMap[source].Set(sink, count);
            return count;
        };
        DinicNetwork.prototype.ResetFlow = function () {
            var edges = this.edgeList;
            for (var i = 0; i < edges.length; i++) {
                edges[i].flow = 0;
            }
        };
        DinicNetwork.prototype.UpdateEdge = function (srcNodeInd, destNodeInd, newCap) {
            var targetEdgeInd = this.edgeMap[srcNodeInd].Get(destNodeInd);
            this.edgeList[targetEdgeInd].capacity = newCap;
        };
        DinicNetwork.prototype.Clone = function () {
            var clone = new DinicNetwork();
            for (var i = 0; i < this.nodeList.length; i++)
                clone.CreateNode();
            var originalEdges = this.edgeList;
            for (var i = 0; i < originalEdges.length; i += 2) {
                var oEdge = originalEdges[i];
                var oRes = originalEdges[i + 1];
                var cEdgeInd = clone.CreateEdge(oEdge.source, oEdge.sink, oEdge.capacity);
                var cEdge = clone.edgeList[cEdgeInd];
                var cRes = clone.edgeList[cEdgeInd + 1];
                cEdge.flow = oEdge.flow;
                cRes.flow = oRes.flow;
            }
            return clone;
        };
        return DinicNetwork;
    }());
    exports.DinicNetwork = DinicNetwork;
    var lGraph = 0;
    var fPath = 0;
    var nAugment = 0;
    function DinicLevelGraph(sinkID, sourceID, nodes, visitedArr, levelGraph) {
        lGraph++;
        Util.Memset(levelGraph, -1);
        var _a = visitedArr.UpdateToken(), visited = _a[0], visitedToken = _a[1];
        var nodeFrontier = new DS.CircularBufferQueue();
        var depthFrontier = new DS.CircularBufferQueue();
        nodeFrontier.Enqueue(sourceID);
        depthFrontier.Enqueue(0);
        visited[sourceID] = visitedToken;
        while (nodeFrontier.Count() > 0) {
            var nodeID = nodeFrontier.Dequeue();
            var depth = depthFrontier.Dequeue();
            levelGraph[nodeID] = depth;
            var node = nodes[nodeID];
            var edges = node.edges;
            var nextDepth = depth + 1;
            for (var i = 0; i < edges.length; i++) {
                var e = edges[i];
                if ((e.capacity - e.flow) > 0 &&
                    (visited[e.sink] != visitedToken)) {
                    visited[e.sink] = visitedToken;
                    nodeFrontier.Enqueue(e.sink);
                    depthFrontier.Enqueue(nextDepth);
                }
            }
        }
        var pathFound = levelGraph[sinkID] != -1;
        return pathFound;
    }
    function DinicFindPath(sinkID, sourceID, nodes, visitedArr, levelGraph, path, activeEdge) {
        fPath++;
        var _a = visitedArr.UpdateToken(), visited = _a[0], visitedToken = _a[1];
        path[sinkID] = -1;
        path[sourceID] = -1;
        var stack = [];
        stack.push(sourceID);
        visited[sourceID] = visitedToken;
        while (stack.length > 0) {
            var nodeID = stack[stack.length - 1];
            if (nodeID == sinkID)
                break;
            var edgeList = nodes[nodeID].edges;
            var nodeFound = false;
            for (var i = activeEdge[nodeID]; i < edgeList.length; i++) {
                var e = edgeList[i];
                if ((levelGraph[nodeID] < levelGraph[e.sink]) &&
                    (e.capacity - e.flow > 0) &&
                    (visited[e.sink] != visitedToken)) {
                    visited[e.sink] = visitedToken;
                    path[e.sink] = e.id;
                    stack.push(e.sink);
                    nodeFound = true;
                    break;
                }
                else {
                    activeEdge[nodeID] += 1;
                }
            }
            if (!nodeFound) {
                stack.pop();
            }
        }
        var augmentingPathFound = (path[sinkID] >= 0);
        return augmentingPathFound;
    }
    function DinicAugmentFlow(sinkID, sourceID, edges, path) {
        nAugment++;
        var MAX_INT = 9007199254740991;
        var walk = sinkID;
        var bottleneck = MAX_INT;
        while (walk != sourceID) {
            var edge = edges[path[walk]];
            var remainingCapacity = edge.capacity - edge.flow;
            bottleneck = Math.min(bottleneck, remainingCapacity);
            walk = edge.source;
        }
        walk = sinkID;
        while (walk != sourceID) {
            var edge = edges[path[walk]];
            var reverse = edges[edge.reverse];
            edge.flow += bottleneck;
            reverse.flow -= bottleneck;
            walk = edge.source;
        }
    }
    function DinicMaxFlow(network, sourceID, sinkID) {
        lGraph = 0;
        fPath = 0;
        nAugment = 0;
        var nodes = network.nodeList;
        var edges = network.edgeList;
        var levelGraph = Util.Fill(nodes.length, 0);
        var visitedArr = new DS.VisitedArray(nodes.length);
        var path = Util.Fill(nodes.length, -1);
        var pathFound = true;
        var activeEdge = Util.Fill(nodes.length, 0);
        while (pathFound) {
            pathFound = DinicLevelGraph(sinkID, sourceID, nodes, visitedArr, levelGraph);
            if (!pathFound)
                continue;
            var augmentedFlow = true;
            Util.Memset(activeEdge, 0);
            while (augmentedFlow) {
                augmentedFlow = DinicFindPath(sinkID, sourceID, nodes, visitedArr, levelGraph, path, activeEdge);
                if (!augmentedFlow)
                    continue;
                DinicAugmentFlow(sinkID, sourceID, edges, path);
            }
        }
        console.log("calls to levelGraph:" + lGraph + "\ncalls to fPath:" + fPath + "\ncalls to augment:" + nAugment);
        return levelGraph;
    }
    exports.DinicMaxFlow = DinicMaxFlow;
    function MinCut(network, sourceID, sinkID, levelGraph) {
        var minCutIndices = [];
        var visitedNodeList = [];
        var nodes = network.nodeList;
        var visited = Util.Fill(nodes.length, false);
        var frontier = new DS.CircularBufferQueue();
        frontier.Enqueue(sourceID);
        visited[sourceID] = true;
        while (frontier.Count() > 0) {
            var nodeID = frontier.Dequeue();
            visitedNodeList.push(nodeID);
            var currentNode = nodes[nodeID];
            currentNode.edges.forEach(function (e) {
                var nextNodeID = e.sink;
                if (!visited[nextNodeID]) {
                    if (levelGraph[nextNodeID] >= 0) {
                        visited[nextNodeID] = true;
                        frontier.Enqueue(nextNodeID);
                    }
                    else {
                        if (e.capacity > 0) {
                            minCutIndices.push(e.id);
                        }
                    }
                }
            });
        }
        return { nodeList: visitedNodeList, edgeIndices: minCutIndices };
    }
    exports.MinCut = MinCut;
    exports.DinicSolver = function (src, sink, network) {
        var levelGraph = DinicMaxFlow(network, src, sink);
        var minCut = MinCut(network, src, sink, levelGraph);
        var sourceOutflux = function () {
            var srcNode = network.nodeList[src];
            return Util.Sum(srcNode.edges.map(function (e) { return e.flow; }));
        };
        var STreeIndices = function () { return minCut.nodeList; };
        return {
            GetMaxFlow: sourceOutflux,
            GetSourcePartition: STreeIndices
        };
    };
});
define("KMeans", ["require", "exports", "Utility", "Matrix", "Collections", "ConvergenceChecker"], function (require, exports, Util, Mat, Collections_2, Conv) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Fit = exports.Initializer = exports.KMeansResult = void 0;
    var KMeansResult = (function () {
        function KMeansResult(_clusters, _means) {
            this.meanDist = -1;
            this.clusters = _clusters;
            this.means = _means;
        }
        KMeansResult.prototype.MeanDistanceToCluster = function () {
            var _this = this;
            if (this.meanDist >= 0)
                return this.meanDist;
            var nElems = Util.Sum(this.clusters.map(function (c) { return c.length; }));
            var distAcc = 0;
            this.clusters.forEach(function (c, ind) {
                for (var i = 0; i < c.length; i++) {
                    var diff = Mat.Sub(c[i], _this.means[ind]);
                    distAcc += Mat.Norm(diff);
                }
            });
            this.meanDist = distAcc / nElems;
            return this.meanDist;
        };
        return KMeansResult;
    }());
    exports.KMeansResult = KMeansResult;
    var Initializer;
    (function (Initializer) {
        Initializer[Initializer["random"] = 0] = "random";
        Initializer[Initializer["KMeansPlusPlus"] = 1] = "KMeansPlusPlus";
    })(Initializer = exports.Initializer || (exports.Initializer = {}));
    function kMeansPlusPlusInit(nClusters, data) {
        var selected = new Collections_2.Dictionary();
        var firstIndex = Math.floor(Math.random() * (data.length - 1));
        selected.Set(firstIndex, true);
        var centres = [data[firstIndex]];
        var prob = new Array(data.length);
        var cumProb = new Array(data.length);
        while (centres.length < nClusters) {
            for (var i = 0; i < data.length; i++) {
                var minDist = Number.MAX_VALUE;
                for (var c = 0; c < centres.length; c++) {
                    var diff = Mat.Sub(data[i], centres[c]);
                    var dist = Mat.NormSquare(diff);
                    if (dist < minDist) {
                        minDist = dist;
                    }
                }
                prob[i] = minDist;
            }
            var acc = 0;
            for (var i = 0; i < prob.length; i++) {
                acc += prob[i];
                cumProb[i] = acc;
            }
            var max = cumProb[cumProb.length - 1];
            var selectedIndex = 0;
            do {
                var rand = Math.random() * max;
                for (var i = 0; i < cumProb.length; i++) {
                    if (cumProb[i] >= rand) {
                        selectedIndex = i;
                        break;
                    }
                }
            } while (selected.ContainsKey(selectedIndex));
            selected.Set(selectedIndex, true);
            centres.push(data[selectedIndex]);
        }
        return centres;
    }
    function Fit(data, nClusters, nIter, minPercentChange, init) {
        if (nIter === void 0) { nIter = 100; }
        if (minPercentChange === void 0) { minPercentChange = 1; }
        if (init === void 0) { init = Initializer.KMeansPlusPlus; }
        var _a = Mat.Dimensions(data[0]), nRows = _a[0], nCols = _a[1];
        var means = [];
        if (init == Initializer.random) {
            means = Util.UniqueRandom(nClusters, data.length - 1).map(function (i) { return data[i]; });
        }
        else {
            means = kMeansPlusPlusInit(nClusters, data);
        }
        var conv = new Conv.ConvergenceChecker(minPercentChange, nIter);
        var result;
        var clusters = GroupToNearestMean(data, means);
        do {
            means = clusters.map(function (c) {
                var acc = Mat.CreateMatrix(nRows, nCols);
                for (var i = 0; i < c.length; i++) {
                    Mat.AddInPlace(acc, c[i]);
                }
                return Mat.Scale(1 / c.length, acc);
            });
            clusters = GroupToNearestMean(data, means);
            result = new KMeansResult(clusters, means);
        } while (!conv.hasConverged(result.MeanDistanceToCluster()));
        console.log("KMeans exited at " + conv.getCurrentIter());
        return result;
    }
    exports.Fit = Fit;
    function GroupToNearestMean(data, means) {
        var nClusters = means.length;
        var clusters = Util.FillObj(nClusters, function () { return []; });
        for (var d = 0; d < data.length; d++) {
            var _a = [Number.MAX_VALUE, -1], maxDist = _a[0], clusterInd = _a[1];
            for (var m = 0; m < nClusters; m++) {
                var diff = Mat.Sub(data[d], means[m]);
                var dist = Mat.NormSquare(diff);
                if (dist < maxDist) {
                    maxDist = dist;
                    clusterInd = m;
                }
            }
            clusters[clusterInd].push(data[d]);
        }
        return clusters;
    }
});
define("GMM", ["require", "exports", "Utility", "Matrix", "KMeans", "ConvergenceChecker"], function (require, exports, Util, Mat, KM, Conv) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GMM = exports.GMMResult = exports.Initializer = exports.GMMCluster = void 0;
    var GMMCluster = (function () {
        function GMMCluster(_pi, _mean, _covariance) {
            this.pi = _pi;
            this.mean = _mean;
            var epsilon = 1e-8;
            if (Math.abs(Mat.Determinant(_covariance)) < epsilon) {
                var dim = Mat.Rows(_covariance);
                var epsMat = Mat.Scale(epsilon, Mat.Identity(dim));
                _covariance = Mat.Add(_covariance, epsMat);
            }
            this.covariance = _covariance;
            this.covarianceDet = Mat.Determinant(_covariance);
            this.covarianceInv = Mat.Inverse(_covariance);
            this.dim = Math.max.apply(Math, Mat.Dimensions(_mean));
            var coeffDenominator = Math.sqrt(Math.pow(2 * Math.PI, this.dim) * Math.abs(this.covarianceDet));
            this.coeff = this.pi * (1 / coeffDenominator);
        }
        GMMCluster.prototype.Likelihood = function (observation) {
            var diff = Mat.Sub(observation, this.mean);
            var diff_Transposed = Mat.Transpose(diff);
            var exponentMat = Mat.Mul(Mat.Mul(diff_Transposed, this.covarianceInv), diff);
            var exponent = -0.5 * exponentMat[0][0];
            var result = this.coeff * Math.exp(exponent);
            return result;
        };
        return GMMCluster;
    }());
    exports.GMMCluster = GMMCluster;
    var Initializer;
    (function (Initializer) {
        Initializer[Initializer["random"] = 0] = "random";
        Initializer[Initializer["KMeansPlusPlus"] = 1] = "KMeansPlusPlus";
    })(Initializer = exports.Initializer || (exports.Initializer = {}));
    var GMMResult = (function () {
        function GMMResult(likelihoods) {
            this.likelihoods = likelihoods;
        }
        GMMResult.prototype.TotalLikelihood = function () {
            return Util.Sum(this.likelihoods);
        };
        GMMResult.prototype.Normalized = function () {
            var max = Util.Max(this.likelihoods);
            return this.likelihoods.map(function (l) { return l / max; });
        };
        return GMMResult;
    }());
    exports.GMMResult = GMMResult;
    var GMM = (function () {
        function GMM() {
        }
        GMM.PreclusteredDataToGMM = function (clusteredData) {
            var gmm = new GMM();
            var totalPoints = Util.Sum(clusteredData.map(function (c) { return c.length; }));
            gmm.clusters = clusteredData.map(function (c) { return GMM.Points2GMMCluster(c, totalPoints); });
            return gmm;
        };
        GMM.Points2GMMCluster = function (data, dataPointsInGMMSet) {
            if (data.length == 0) {
                throw new Error("GMM cluster cannot be empty");
            }
            var nData = data.length;
            var weight = nData / dataPointsInGMMSet;
            var params = Mat.MeanAndCovariance(data);
            return new GMMCluster(weight, params.mean, params.covariance);
        };
        GMM.prototype.RandomInit = function (data, nClusters) {
            var nDim = Mat.Rows(data[0]);
            var selectedIndices = Util.UniqueRandom(nClusters, data.length - 1);
            var equalWeightage = 1 / nClusters;
            return selectedIndices.map(function (i) {
                return new GMMCluster(equalWeightage, data[i], Mat.Identity(nDim));
            });
        };
        GMM.prototype.EM = function (data, initialClusters) {
            var ReplaceZeroes = function (arr, lowerThreshold) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] < lowerThreshold)
                        arr[i] = lowerThreshold;
                }
            };
            var nDataPoints = data.length;
            var nDims = Mat.Rows(data[0]);
            var nClusters = initialClusters.length;
            var prob = Mat.CreateMatrix(nClusters, nDataPoints);
            var probSum = Util.Fill(data.length, 0);
            for (var c = 0; c < nClusters; c++) {
                var currentCluster = initialClusters[c];
                for (var d = 0; d < nDataPoints; d++) {
                    var p = currentCluster.Likelihood(data[d]);
                    if (isNaN(p)) {
                        console.log(currentCluster);
                        throw new Error("NaN");
                    }
                    prob[c][d] = p;
                    probSum[d] += p;
                }
            }
            var eps = 1e-9;
            ReplaceZeroes(probSum, eps);
            var resp = Mat.CreateMatrix(nClusters, nDataPoints);
            var clusterResp = Util.Fill(nClusters, 0);
            for (var c = 0; c < nClusters; c++) {
                for (var d = 0; d < nDataPoints; d++) {
                    var r = prob[c][d] / probSum[d];
                    resp[c][d] = r;
                    clusterResp[c] += r;
                }
            }
            ReplaceZeroes(clusterResp, eps);
            var clusterSum = Util
                .FillObj(nClusters, function () { return Mat.CreateMatrix(nDims, 1); });
            for (var c = 0; c < nClusters; c++) {
                for (var d = 0; d < nDataPoints; d++) {
                    var contribution = Mat.Scale(resp[c][d], data[d]);
                    Mat.AddInPlace(clusterSum[c], contribution);
                }
            }
            var means = clusterSum
                .map(function (sum, index) { return Mat.Scale(1 / clusterResp[index], sum); });
            var weights = clusterResp.map(function (x) { return x / nDataPoints; });
            var covAcc = Util
                .FillObj(nClusters, function () { return Mat.CreateMatrix(nDims, nDims); });
            for (var c = 0; c < nClusters; c++) {
                for (var d = 0; d < nDataPoints; d++) {
                    var diff = Mat.Sub(data[d], means[c]);
                    var diffTransposed = Mat.Transpose(diff);
                    var contribution = Mat.Scale(resp[c][d], Mat.Mul(diff, diffTransposed));
                    Mat.AddInPlace(covAcc[c], contribution);
                }
            }
            var covariances = covAcc.map(function (cov, ind) { return Mat.Scale(1 / clusterResp[ind], cov); });
            console.log(clusterResp);
            return means.map(function (_, cIndex) {
                return new GMMCluster(weights[cIndex], means[cIndex], covariances[cIndex]);
            });
        };
        GMM.prototype.Fit = function (rawData, nClusters, init, MAX_ITER, MIN_PERCENT_CHANGE) {
            if (init === void 0) { init = Initializer.KMeansPlusPlus; }
            if (MAX_ITER === void 0) { MAX_ITER = 20; }
            if (MIN_PERCENT_CHANGE === void 0) { MIN_PERCENT_CHANGE = 1; }
            if (!Mat.IsVector(rawData[0])) {
                throw new Error("GMM.Fit: Error, data points need to be vectors (ideally column vectors)");
            }
            var data = rawData;
            if (Mat.IsRowVector(rawData[0])) {
                data = rawData.map(function (m) { return Mat.Transpose(m); });
            }
            var newClusters;
            switch (init) {
                case Initializer.random: {
                    newClusters = this.RandomInit(data, nClusters);
                    break;
                }
                case Initializer.KMeansPlusPlus: {
                    var kMeansResult = KM.Fit(data, nClusters, 20, 1, KM.Initializer.KMeansPlusPlus);
                    newClusters = kMeansResult.clusters.map(function (c) { return GMM.Points2GMMCluster(c, data.length); });
                    break;
                }
            }
            var conv = new Conv.ConvergenceChecker(MIN_PERCENT_CHANGE, MAX_ITER);
            var logProb;
            do {
                newClusters = this.EM(data, newClusters);
                logProb = GMM.LogLikelihood(data, newClusters);
                console.log("Iteration:" + conv.getCurrentIter() + ", logProb:" + logProb);
            } while (!conv.hasConverged(logProb));
            this.clusters = newClusters;
        };
        GMM.prototype.Predict = function (rawData) {
            var data = Mat.IsColumnVector(rawData) ? rawData : Mat.Transpose(rawData);
            var predictions = new Array(this.clusters.length);
            for (var i = 0; i < predictions.length; i++) {
                predictions[i] = this.clusters[i].Likelihood(data);
            }
            return new GMMResult(predictions);
        };
        GMM.LogLikelihood = function (data, gmm) {
            var logProb = 0;
            for (var d = 0; d < data.length; d++) {
                var acc = 0;
                for (var c = 0; c < gmm.length; c++) {
                    acc += gmm[c].Likelihood(data[d]);
                }
                logProb += Math.log(acc);
            }
            return logProb;
        };
        return GMM;
    }());
    exports.GMM = GMM;
});
define("GrabCut", ["require", "exports", "GMM", "BKGraph", "Matrix", "Utility", "ConvergenceChecker"], function (require, exports, GMM, BK, Mat, Util, Conv) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GrabCut = exports.Trimap = void 0;
    var Trimap;
    (function (Trimap) {
        Trimap[Trimap["Background"] = 0] = "Background";
        Trimap[Trimap["Foreground"] = 1] = "Foreground";
        Trimap[Trimap["Unknown"] = 2] = "Unknown";
    })(Trimap = exports.Trimap || (exports.Trimap = {}));
    var GrabCut = (function () {
        function GrabCut(image) {
            this.fgGMM = new GMM.GMM();
            this.bgGMM = new GMM.GMM();
            this.height = image.length;
            this.width = image[0].length;
            this.img = image;
            var nPixels = this.width * this.height;
            this.matte = new Uint8Array(nPixels);
            this.trimap = new Uint8Array(nPixels);
        }
        GrabCut.prototype.SetTrimap = function (trimap, width, height) {
            for (var r = 0; r < height; r++) {
                for (var c = 0; c < width; c++) {
                    var ind = GrabCut.GetArrayIndex(r, c, width);
                    this.trimap[ind] = trimap[r][c];
                }
            }
        };
        GrabCut.prototype.BeginCrop = function (opt) {
            for (var i = 0; i < this.trimap.length; i++) {
                this.matte[i] = (this.trimap[i] == Trimap.Background) ? Trimap.Background : Trimap.Foreground;
            }
            var _a = GrabCut.SegregatePixels(this.img, this.matte, 0, 0, this.height, this.width), fgPixels = _a[0], bgPixels = _a[1];
            var GMM_N_ITER = 5;
            var MIN_PERCENT_CHANGE = 1;
            this.fgGMM.Fit(fgPixels, 5, GMM.Initializer.KMeansPlusPlus, GMM_N_ITER, MIN_PERCENT_CHANGE);
            this.bgGMM.Fit(bgPixels, 5, GMM.Initializer.KMeansPlusPlus, GMM_N_ITER, MIN_PERCENT_CHANGE);
            this.RunIterations(opt.maxIterations, opt.tolerance);
        };
        GrabCut.prototype.RunIterations = function (nIter, tolerancePercent) {
            var _a;
            var flowNetwork = new BK.BKNetwork();
            var maxFlowSolver = BK.BKMaxflow;
            var _b = GrabCut.GeneratePixel2PixelGraph(this.img, flowNetwork), network = _b[0], maxCapacity = _b[1];
            var _c = GrabCut.InitSourceAndSink(network, this.width, this.height), srcNode = _c[0], sinkNode = _c[1];
            var conv = new Conv.ConvergenceChecker(tolerancePercent, nIter);
            var energy;
            do {
                console.log("iter:" + conv.getCurrentIter());
                var _d = GrabCut.SegregatePixels(this.img, this.matte, 0, 0, this.height, this.width), fgPixels = _d[0], bgPixels = _d[1];
                var _e = GrabCut.BinPixels(this.fgGMM, this.bgGMM, bgPixels, fgPixels), fgClusters = _e[0], bgClusters = _e[1];
                _a = [fgClusters, bgClusters].map(function (mixture) {
                    var nonEmptyClusters = mixture.filter(function (cluster) { return cluster.length > 0; });
                    return GMM.GMM.PreclusteredDataToGMM(nonEmptyClusters);
                }), this.fgGMM = _a[0], this.bgGMM = _a[1];
                console.log("fg clusters:" + this.fgGMM.clusters.length + ", bg clusters:" + this.bgGMM.clusters.length);
                GrabCut.UpdateSourceAndSink(network, maxCapacity, this.fgGMM, this.bgGMM, this.img, this.trimap, srcNode, sinkNode);
                network.ResetFlow();
                console.log('max flow');
                var flowResult = maxFlowSolver(srcNode, sinkNode, network);
                console.log('cut');
                var fgPixelIndices = flowResult.GetSourcePartition();
                GrabCut.UpdateMatte(this.matte, this.trimap, fgPixelIndices);
                energy = flowResult.GetMaxFlow();
                console.log("Energy: " + energy);
            } while (!conv.hasConverged(energy));
        };
        GrabCut.prototype.GetAlphaMask = function () {
            var alpha = Mat.CreateMatrix(this.height, this.width);
            for (var i = 0; i < this.matte.length; i++) {
                var _a = GrabCut.get2DArrayIndex(i, this.width), r = _a[0], c = _a[1];
                alpha[r][c] = (this.matte[i] == Trimap.Foreground) ? 1.0 : 0.0;
            }
            return alpha;
        };
        GrabCut.UpdateMatte = function (matte, trimap, fgPixelIndices) {
            var indexTable = Util.HashItems(fgPixelIndices, function (n) { return n; });
            for (var i = 0; i < matte.length; i++) {
                if (trimap[i] == Trimap.Unknown) {
                    var isFG = indexTable.ContainsKey(i);
                    matte[i] = (isFG) ? Trimap.Foreground : Trimap.Background;
                }
            }
        };
        GrabCut.SegregatePixels = function (img, matte, top, left, height, width) {
            var fgPixels = [];
            var bgPixels = [];
            var right = left + width;
            var bot = top + height;
            for (var r = top; r < bot; r++) {
                for (var c = left; c < right; c++) {
                    var matteIndex = GrabCut.GetArrayIndex(r, c, width);
                    var currentPixel = img[r][c];
                    if (matte[matteIndex] == Trimap.Foreground) {
                        fgPixels.push(currentPixel);
                    }
                    else {
                        bgPixels.push(currentPixel);
                    }
                }
            }
            return [fgPixels, bgPixels];
        };
        GrabCut.BinPixels = function (fgGMM, bgGMM, bgPixels, fgPixels) {
            var maxIndex = function (arr) {
                var max = Number.MIN_SAFE_INTEGER;
                var maxInd = -1;
                for (var i = 0; i < arr.length; i++) {
                    var current = arr[i];
                    if (current > max) {
                        maxInd = i;
                        max = current;
                    }
                }
                return maxInd;
            };
            var fg = Util.FillObj(fgGMM.clusters.length, function () { return []; });
            var bg = Util.FillObj(bgGMM.clusters.length, function () { return []; });
            for (var i = 0; i < bgPixels.length; i++) {
                var pixel = bgPixels[i];
                var prob = bgGMM.Predict(pixel).likelihoods;
                var bin = maxIndex(prob);
                if (bin < 0) {
                    console.log(prob);
                    throw new Error("pixel bin cannot be found");
                }
                bg[bin].push(pixel);
            }
            for (var i = 0; i < fgPixels.length; i++) {
                var pixel = fgPixels[i];
                var prob = fgGMM.Predict(pixel).likelihoods;
                var bin = maxIndex(prob);
                fg[bin].push(pixel);
            }
            return [fg, bg];
        };
        GrabCut.GeneratePixel2PixelGraph = function (img, network) {
            var height = img.length;
            var width = img[0].length;
            {
                var nPixels = height * width;
                for (var i = 0; i < nPixels; i++) {
                    network.CreateNode();
                }
            }
            var neighbours = [[0, -1], [-1, 0], [0, 1], [1, 0]];
            var coeff = neighbours.map(function (t) { return 50 / Math.sqrt(Math.pow(t[0], 2) + Math.pow(t[1], 2)); });
            var maxCap = Number.MIN_SAFE_INTEGER;
            var GetNeighbour = function (r, c, neighbourInd) {
                var offset = neighbours[neighbourInd];
                var nR = r + offset[0];
                var nC = c + offset[1];
                var validNeighbour = GrabCut.WithinBounds(nR, nC, width, height);
                return [validNeighbour, nR, nC];
            };
            var nCount = 0;
            var diffAcc = 0;
            for (var r = 0; r < height; r++) {
                for (var c = 0; c < width; c++) {
                    var currentPixel = img[r][c];
                    for (var i = 0; i < neighbours.length; i++) {
                        var _a = GetNeighbour(r, c, i), validNeighbour = _a[0], nR = _a[1], nC = _a[2];
                        if (!validNeighbour)
                            continue;
                        var neighbouringPixel = img[nR][nC];
                        var diffSquare = Mat.NormSquare(Mat.Sub(currentPixel, neighbouringPixel));
                        diffAcc += diffSquare;
                        nCount++;
                    }
                }
            }
            var beta = 0.5 / (diffAcc / nCount);
            for (var r = 0; r < height; r++) {
                for (var c = 0; c < width; c++) {
                    var nodeIndex = GrabCut.GetArrayIndex(r, c, width);
                    for (var i = 0; i < neighbours.length; i++) {
                        var _b = GetNeighbour(r, c, i), validNeighbour = _b[0], nR = _b[1], nC = _b[2];
                        if (!validNeighbour)
                            continue;
                        var neighbourIndex = GrabCut.GetArrayIndex(nR, nC, width);
                        var diffSquare = Mat.NormSquare(Mat.Sub(img[r][c], img[nR][nC]));
                        var exponent = -beta * diffSquare;
                        var capacity = coeff[i] * Math.exp(exponent);
                        if (isNaN(capacity)) {
                            console.log({
                                coeff: coeff,
                                beta: beta,
                                exponent: exponent,
                                capacity: capacity
                            });
                        }
                        network.CreateEdge(nodeIndex, neighbourIndex, capacity);
                        maxCap = (capacity > maxCap) ? capacity : maxCap;
                    }
                }
            }
            return [network, maxCap];
        };
        GrabCut.InitSourceAndSink = function (network, width, height) {
            var srcInd = network.CreateNode();
            var sinkInd = network.CreateNode();
            for (var r = 0; r < height; r++) {
                for (var c = 0; c < width; c++) {
                    var pixelNodeInd = GrabCut.GetArrayIndex(r, c, width);
                    network.CreateEdge(srcInd, pixelNodeInd, 0);
                }
            }
            for (var r = 0; r < height; r++) {
                for (var c = 0; c < width; c++) {
                    var pixelNodeInd = GrabCut.GetArrayIndex(r, c, width);
                    network.CreateEdge(pixelNodeInd, sinkInd, 0);
                }
            }
            return [srcInd, sinkInd];
        };
        GrabCut.UpdateSourceAndSink = function (network, maxCap, gmmFG, gmmBG, image, trimap, srcNode, sinkNode) {
            var _a = [image.length, image[0].length], nRows = _a[0], nCols = _a[1];
            for (var r = 0; r < nRows; r++) {
                for (var c = 0; c < nCols; c++) {
                    var ind = GrabCut.GetArrayIndex(r, c, nCols);
                    switch (trimap[ind]) {
                        case Trimap.Foreground: {
                            network.UpdateEdge(srcNode, ind, maxCap);
                            network.UpdateEdge(ind, sinkNode, 0);
                            break;
                        }
                        case Trimap.Background: {
                            network.UpdateEdge(srcNode, ind, 0);
                            network.UpdateEdge(ind, sinkNode, maxCap);
                            break;
                        }
                        case Trimap.Unknown: {
                            var currentPixel = image[r][c];
                            var pFore = GrabCut.GetTLinkWeight(gmmBG, currentPixel);
                            var pBack = GrabCut.GetTLinkWeight(gmmFG, currentPixel);
                            network.UpdateEdge(srcNode, ind, pFore);
                            network.UpdateEdge(ind, sinkNode, pBack);
                            break;
                        }
                    }
                }
            }
        };
        GrabCut.GetTLinkWeight = function (gmm, pixel) {
            var gmmResult = gmm.Predict(pixel).TotalLikelihood();
            var res = -Math.log(gmmResult);
            if (isNaN(res)) {
                console.log({
                    gmm: gmm,
                    res: res,
                    pixel: pixel,
                    gmmResult: gmmResult
                });
                return 0;
            }
            return res;
        };
        GrabCut.WithinBounds = function (row, col, width, height) {
            return (row >= 0 && row < height) && (col >= 0 && col < width);
        };
        GrabCut.GetArrayIndex = function (row, col, width) {
            return row * width + col;
        };
        GrabCut.get2DArrayIndex = function (index1D, width) {
            var row = Math.floor(index1D / width);
            var col = index1D % width;
            return [row, col];
        };
        return GrabCut;
    }());
    exports.GrabCut = GrabCut;
});
define("MaxFlowTestCase", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.t16 = exports.t50 = exports.test3 = exports.fCase2 = exports.MFCase = void 0;
    exports.MFCase = "\nc Mesh Graph\nc 10 Rows, 10 columns, capacities in range [0, 1000000]\np max 102 290\nn 1 s\nn 102 t\na 1 11 3000000\na 1 10 3000000\na 1 9 3000000\na 1 8 3000000\na 1 7 3000000\na 1 6 3000000\na 1 5 3000000\na 1 4 3000000\na 1 3 3000000\na 1 2 3000000\na 2 13 948726\na 2 12 81247\na 2 21 79388\na 3 14 975148\na 3 13 143780\na 3 12 71011\na 4 15 441834\na 4 14 460048\na 4 13 850451\na 5 16 638042\na 5 15 274382\na 5 14 663217\na 6 17 474914\na 6 16 103301\na 6 15 146796\na 7 18 169985\na 7 17 110250\na 7 16 688836\na 8 19 997375\na 8 18 352413\na 8 17 934539\na 9 20 629253\na 9 19 651303\na 9 18 989106\na 10 21 948856\na 10 20 654642\na 10 19 428820\na 11 12 243128\na 11 21 437571\na 11 20 208830\na 12 23 324374\na 12 22 33310\na 12 31 795443\na 13 24 984506\na 13 23 104321\na 13 22 260521\na 14 25 444553\na 14 24 954771\na 14 23 235668\na 15 26 718934\na 15 25 617987\na 15 24 677501\na 16 27 338586\na 16 26 764782\na 16 25 315542\na 17 28 448836\na 17 27 969970\na 17 26 306807\na 18 29 317600\na 18 28 420860\na 18 27 993143\na 19 30 485255\na 19 29 409965\na 19 28 990517\na 20 31 139896\na 20 30 355136\na 20 29 619769\na 21 22 577466\na 21 31 563966\na 21 30 84977\na 22 33 610776\na 22 32 875760\na 22 41 328104\na 23 34 231448\na 23 33 136280\na 23 32 168830\na 24 35 186218\na 24 34 371947\na 24 33 669687\na 25 36 804205\na 25 35 565800\na 25 34 630591\na 26 37 85338\na 26 36 397693\na 26 35 865877\na 27 38 571659\na 27 37 704500\na 27 36 204462\na 28 39 992518\na 28 38 697642\na 28 37 169649\na 29 40 402483\na 29 39 204511\na 29 38 487249\na 30 41 757618\na 30 40 340631\na 30 39 972503\na 31 32 837935\na 31 41 941959\na 31 40 628750\na 32 43 713695\na 32 42 786415\na 32 51 722568\na 33 44 366326\na 33 43 471596\na 33 42 849695\na 34 45 254625\na 34 44 141282\na 34 43 81142\na 35 46 820424\na 35 45 771872\na 35 44 267359\na 36 47 734468\na 36 46 637748\na 36 45 587915\na 37 48 955319\na 37 47 842210\na 37 46 189605\na 38 49 169313\na 38 48 11858\na 38 47 761263\na 39 50 373823\na 39 49 15458\na 39 48 753781\na 40 51 230805\na 40 50 504312\na 40 49 672615\na 41 42 172764\na 41 51 133062\na 41 50 946584\na 42 53 475530\na 42 52 371981\na 42 61 784519\na 43 54 947125\na 43 53 221675\na 43 52 14565\na 44 55 88406\na 44 54 819168\na 44 53 380890\na 45 56 376629\na 45 55 602878\na 45 54 151866\na 46 57 14377\na 46 56 190793\na 46 55 488641\na 47 58 372938\na 47 57 896749\na 47 56 223109\na 48 59 901147\na 48 58 174363\na 48 57 178427\na 49 60 432957\na 49 59 444495\na 49 58 347739\na 50 61 937268\na 50 60 117109\na 50 59 237913\na 51 52 586681\na 51 61 63693\na 51 60 985070\na 52 63 958661\na 52 62 364563\na 52 71 674185\na 53 64 696687\na 53 63 379127\na 53 62 149714\na 54 65 515854\na 54 64 276368\na 54 63 96838\na 55 66 118732\na 55 65 428234\na 55 64 701595\na 56 67 825876\na 56 66 916874\na 56 65 78223\na 57 68 238976\na 57 67 656334\na 57 66 608951\na 58 69 413338\na 58 68 351113\na 58 67 981888\na 59 70 857833\na 59 69 215203\na 59 68 399387\na 60 71 974941\na 60 70 453116\na 60 69 832343\na 61 62 554985\na 61 71 954537\na 61 70 285962\na 62 73 919547\na 62 72 628721\na 62 81 388995\na 63 74 815025\na 63 73 294786\na 63 72 864007\na 64 75 91393\na 64 74 391623\na 64 73 560694\na 65 76 35978\na 65 75 609569\na 65 74 76547\na 66 77 469203\na 66 76 687791\na 66 75 711630\na 67 78 125537\na 67 77 296742\na 67 76 537505\na 68 79 993001\na 68 78 794981\na 68 77 776480\na 69 80 208203\na 69 79 194367\na 69 78 706170\na 70 81 177670\na 70 80 543061\na 70 79 564002\na 71 72 132206\na 71 81 345375\na 71 80 55294\na 72 83 760926\na 72 82 734369\na 72 91 126631\na 73 84 55711\na 73 83 598375\na 73 82 46177\na 74 85 963685\na 74 84 159068\na 74 83 377554\na 75 86 573253\na 75 85 751967\na 75 84 985298\na 76 87 777396\na 76 86 979948\na 76 85 21275\na 77 88 590489\na 77 87 517453\na 77 86 6829\na 78 89 385469\na 78 88 810284\na 78 87 132365\na 79 90 96188\na 79 89 516453\na 79 88 125365\na 80 91 155600\na 80 90 80454\na 80 89 849920\na 81 82 500974\na 81 91 652100\na 81 90 27589\na 82 93 751694\na 82 92 778730\na 82 101 159795\na 83 94 350069\na 83 93 341258\na 83 92 437072\na 84 95 25488\na 84 94 718811\na 84 93 9135\na 85 96 293806\na 85 95 220460\na 85 94 489171\na 86 97 273754\na 86 96 241734\na 86 95 578776\na 87 98 791206\na 87 97 248563\na 87 96 356171\na 88 99 117841\na 88 98 897279\na 88 97 946659\na 89 100 634294\na 89 99 538996\na 89 98 848479\na 90 101 231099\na 90 100 388915\na 90 99 461018\na 91 92 399550\na 91 101 416503\na 91 100 132970\na 92 102 3000000\na 93 102 3000000\na 94 102 3000000\na 95 102 3000000\na 96 102 3000000\na 97 102 3000000\na 98 102 3000000\na 99 102 3000000\na 100 102 3000000\na 101 102 3000000";
    exports.fCase2 = "\np max 12 15\nn 1 s\nn 12 t\ncn 2 X\ncn 3 Y\ncn 4 Z\ncn 5 A\ncn 6 B\ncn 7 C\ncn 8 u\ncn 9 v\ncn 10 w\ncn 11 r\n\na 1 2 500\na 1 3 500\na 1 4 900\na 2 10 300\na 3 10 200\na 3 9 600\na 4 8 700\na 8 11 500\na 8 3 300\na 10 5 600\na 9 6 500\na 9 7 200\na 11 7 200\na 5 12 700\na 6 12 600\na 7 12 600\n";
    exports.test3 = "\np max 6 8\nc source\nn 1 s\nc sink\nn 6 t\nc Arc descriptor lines (from, to, capacity)\na 1 2 5\na 1 3 15\na 2 4 5\na 2 5 5\na 3 4 5\na 3 5 5\na 4 6 15\na 5 6 5\n";
    exports.t50 = "\n0 1000 1000 1000 1000 1000 1000 1000 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 166 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 195 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 195 0 0 0 0 0 0 0 195 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 181 0 0 0 0 0 0 0 78 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 256 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 256 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 43 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 243 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 105 0 0 0 0 0 0 0 115 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 92 0 0 0 0 0 0 0 233 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 78 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 78 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 233 0 0 0 0 0 0 0 233 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 115 0 0 0 0 0 0 0 115 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 115 0 0 0 0 0 0 0 150 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 198 0 0 0 0 0 0 0 246 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 78 0 0 0 0 0 0 0 78 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 233 0 0 0 0 0 0 0 198 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 150 0 0 0 0 0 0 0 140 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 102 0 0 0 0 0 0 0 242 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 53 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 208 0 0 0 0 0 0 0 218 0 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 232 0 0 0 0 0 0 0 67 0 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 67 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 256 0 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 256 0 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 53 0 0 0 0 0 0 0 53 0 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 53 0 0 0 0 0 0 0 256 0 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 0 256 0 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 43 0 0 0 0 0 0 0 256 \n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n1000 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 0 \n1000 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 0 \n1000 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 0 \n1000 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 0 \n1000 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 256 0 0 \n1000 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 43 0";
    exports.t16 = "\n213 213 213 213 213 213 213 213  10  10 213 213 213 213 213 213\n213 213 213 213 213 213 213  10 164 164  10 213 213 213 213 213\n213 213 213 213 213 213  10 164 213 213 164  10 213 213 213 213\n213 213 213 213 213 213  10 164 213 213 164  10 213 213 213 213\n213 213 213 213 213 213  10 164  58  58 164  10 213 213 213 213\n213 213 213 213 213 213 213  35   0  58   0 213 213 213 213 213\n213 213 213 213 213 213   0 199 138  48  48   0   0 213 213 213\n213 213 213 213 213  24 164 213 213 213 213 213   0 213 213 213\n213 213 213 213 213   0 199 199  85  85  85  24  24 213 213 213\n213 213 213 213 213   0 199 199 138  48  35 213 213 213 213 213\n213 213 213 213  10  85 199 199 199 199  58  35 213 213 213 213\n213 213 213  10  58 199 199  58 138 199 199  58   0 213 213 213\n213  10  35 110 199 199  85   0   0  58 199 187  58   0 213 213\n213  24  38 199 187  58  10 213 213  35  58 164  48  10 213 213\n213 213   0 138  10  10 213 213 213 213   0  10  24 213 213 213\n213 213 213   0 213 213 213 213 213 213 213 213 213 213 213 213";
});
define("Tests", ["require", "exports", "DinicFlowSolver", "BKGraph", "MaxFlowTestCase"], function (require, exports, graph, BK, MaxFlowTestCase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function mFlowComparison() {
        var dNetwork = new graph.DinicNetwork();
        var BKNetwork = new BK.BKNetwork();
        var src = 0;
        var dest = 101;
        for (var i = 0; i < 102; i++) {
            dNetwork.CreateNode();
            BKNetwork.CreateNode();
        }
        var arcs = MaxFlowTestCase_1.MFCase
            .split("\n")
            .filter(function (l) { return l.length > 0; })
            .map(function (line) { return line.trim(); })
            .map(function (line) { return line.split(/\s+/); })
            .filter(function (t) { return t[0] == "a"; })
            .map(function (t) { return [t[1], t[2], t[3]].map(function (n) { return parseInt(n); }); });
        arcs.forEach(function (t) {
            var src = t[0] - 1;
            var dest = t[1] - 1;
            var cap = t[2];
            dNetwork.CreateEdge(src, dest, cap);
            BKNetwork.CreateEdge(src, dest, cap);
        });
        var dMaxFlow = graph.DinicSolver(src, dest, dNetwork).GetMaxFlow();
        var bkMaxFlow = BK.BKMaxflow(src, dest, BKNetwork).GetMaxFlow();
        console.log('------------------Max Flow comparison--------------');
        console.log("Dinic:" + dMaxFlow + "\nBK:" + bkMaxFlow);
    }
    mFlowComparison();
    function mFlowComparison2() {
        var dNetwork = new graph.DinicNetwork();
        var BKNetwork = new BK.BKNetwork();
        var arcs = MaxFlowTestCase_1.t16
            .split("\n")
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 0; })
            .map(function (line) { return line.split(/\s+/); })
            .map(function (t) { return t.map(function (n) { return parseInt(n); }); });
        for (var i = 0; i < arcs.length; i++) {
            dNetwork.CreateNode();
            BKNetwork.CreateNode();
        }
        var src = 0;
        var dest = arcs.length - 1;
        arcs.forEach(function (t, ind) {
            for (var i = 0; i < t.length; i++) {
                var src_1 = ind;
                var dest_1 = i;
                var cap = t[i];
                if (src_1 == dest_1 || cap == 0)
                    continue;
                dNetwork.CreateEdge(src_1, dest_1, cap);
                BKNetwork.CreateEdge(src_1, dest_1, cap);
            }
        });
        var dMaxFlow = graph.DinicSolver(src, dest, dNetwork).GetMaxFlow();
        var bkMaxFlow = BK.BKMaxflow(src, dest, BKNetwork).GetMaxFlow();
        console.log('------------------Max Flow comparison 2--------------');
        console.log("Dinic:" + dMaxFlow + "\nBK:" + bkMaxFlow);
        console.log("expected: 2789");
    }
    mFlowComparison2();
    function BkBenchmark() {
        var BKNetwork = new BK.BKNetwork();
        var arcs = MaxFlowTestCase_1.t16
            .split("\n")
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 0; })
            .map(function (line) { return line.split(/\s+/); })
            .map(function (t) { return t.map(function (n) { return parseInt(n); }); });
        for (var i = 0; i < arcs.length; i++) {
            BKNetwork.CreateNode();
        }
        var src = 0;
        var dest = arcs.length - 1;
        arcs.forEach(function (t, ind) {
            for (var i = 0; i < t.length; i++) {
                var src_2 = ind;
                var dest_2 = i;
                var cap = t[i];
                if (src_2 == dest_2 || cap == 0)
                    continue;
                BKNetwork.CreateEdge(src_2, dest_2, cap);
            }
        });
        console.time("BK Bench");
        var bkMaxFlow;
        for (var i = 0; i < 50000; i++) {
            bkMaxFlow = BK.BKMaxflow(src, dest, BKNetwork.Clone()).GetMaxFlow();
        }
        console.timeEnd("BK Bench");
        console.log('--------------BK Benchmark----------');
        console.log("BK:" + bkMaxFlow);
        console.log("expected: 2789");
    }
    BkBenchmark();
});
define("WebPage/FileInput", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileInput = void 0;
    var FileInput = (function () {
        function FileInput(id) {
            var _this = this;
            this.listeners = [];
            this.element = document.getElementById(id);
            var listener = function (arg) { return _this.ProcessInputChange(arg, _this); };
            this.element.addEventListener("change", listener);
            this.data = null;
        }
        FileInput.prototype.ProcessInputChange = function (arg, self) {
            if (self.element.value.length > 0) {
                var reader_1 = new FileReader();
                reader_1.onload = function () {
                    self.data = reader_1.result;
                    self.listeners.forEach(function (l) { return l(); });
                };
                reader_1.readAsDataURL(self.element.files[0]);
            }
        };
        FileInput.prototype.GetDataURL = function () {
            return this.data;
        };
        FileInput.prototype.RegisterImageLoad = function (callback) {
            console.log(callback);
            this.listeners.push(callback);
        };
        return FileInput;
    }());
    exports.FileInput = FileInput;
});
define("WebPage/ImageUtil", ["require", "exports", "Matrix", "Utility"], function (require, exports, Mat, Util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImgData2URL = exports.ApplyAlphaMaskToImgData = exports.CreateBWImage = exports.ApplyAlphaMask = exports.ImageData2Mat = exports.Trimap2BW = exports.EmptyImage = exports.Temp2DCanvas = exports.RGBA = void 0;
    var RGBA = (function () {
        function RGBA(r, g, b, a) {
            this.red = r;
            this.green = g;
            this.blue = b;
            this.alpha = a;
        }
        RGBA.prototype.Equals = function (other) {
            return (this.red == other.red &&
                this.green == other.green &&
                this.blue == other.blue &&
                this.alpha == other.alpha);
        };
        RGBA.prototype.EqualsExcludeAlpha = function (other) {
            return (this.red == other.red &&
                this.green == other.green &&
                this.blue == other.blue);
        };
        RGBA.prototype.CSSValue = function () {
            return "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.alpha / 255 + ")";
        };
        return RGBA;
    }());
    exports.RGBA = RGBA;
    var Temp2DCanvas = (function () {
        function Temp2DCanvas(width, height) {
            var c = document.createElement("canvas");
            c.width = width;
            c.height = height;
            var hDC = c.getContext("2d");
            this.canvas = c;
            this.hDC = hDC;
            this.width = width;
            this.height = height;
        }
        Temp2DCanvas.prototype.GetHDC = function () {
            return this.hDC;
        };
        Temp2DCanvas.prototype.GetImageData = function () {
            return this.hDC.getImageData(0, 0, this.width, this.height);
        };
        Temp2DCanvas.prototype.SetImageData = function (data) {
            this.hDC.putImageData(data, 0, 0);
            return this.canvas.toDataURL();
        };
        return Temp2DCanvas;
    }());
    exports.Temp2DCanvas = Temp2DCanvas;
    var blankImg = null;
    function EmptyImage() {
        if (blankImg != null)
            return blankImg;
        var c = new Temp2DCanvas(1, 1);
        blankImg = c.SetImageData(c.GetImageData());
        return blankImg;
    }
    exports.EmptyImage = EmptyImage;
    function Trimap2BW(trimap) {
        var _a = [trimap[0].length, trimap.length], width = _a[0], height = _a[1];
        var canvas = new Temp2DCanvas(width, height);
        var imgData = canvas.GetImageData();
        var arr = imgData.data;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var offset = (y * width + x) * 4;
                var lum = trimap[y][x] * 122;
                arr[offset + 0] = lum;
                arr[offset + 1] = lum;
                arr[offset + 2] = lum;
                arr[offset + 3] = 255;
            }
        }
        return canvas.SetImageData(imgData);
    }
    exports.Trimap2BW = Trimap2BW;
    function ImageData2Mat(data) {
        var result = Util.Fill2DObj(data.height, data.width, function () { return Mat.CreateMatrix(3, 1); });
        var buffer = data.data;
        var coeff = 1;
        for (var r = 0; r < data.height; r++) {
            var rowOffset = r * data.width;
            for (var c = 0; c < data.width; c++) {
                var ind = 4 * (rowOffset + c);
                var pixel = result[r][c];
                pixel[0][0] = buffer[ind + 0] * coeff;
                pixel[1][0] = buffer[ind + 1] * coeff;
                pixel[2][0] = buffer[ind + 2] * coeff;
            }
        }
        return result;
    }
    exports.ImageData2Mat = ImageData2Mat;
    function ApplyAlphaMask(img, alpha) {
        var _a = [img.width, img.height], width = _a[0], height = _a[1];
        var c = new Temp2DCanvas(width, height);
        var bufferData = c.GetImageData();
        var buffer = bufferData.data;
        buffer.set(img.data);
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var alphaInd = 4 * (width * y + x) + 3;
                buffer[alphaInd] = 255;
                alpha[y][x] * 255;
            }
        }
        return c.SetImageData(bufferData);
    }
    exports.ApplyAlphaMask = ApplyAlphaMask;
    function CreateBWImage(values) {
        var _a = [values[0].length, values.length], width = _a[0], height = _a[1];
        var c = new Temp2DCanvas(width, height);
        var img = c.GetImageData();
        var buffer = img.data;
        for (var r = 0; r < height; r++) {
            for (var c_1 = 0; c_1 < width; c_1++) {
                var ind = (r * width + c_1) * 4;
                var lum = values[r][c_1] * 255;
                buffer[ind + 0] = lum;
                buffer[ind + 1] = lum;
                buffer[ind + 2] = lum;
                buffer[ind + 3] = 255;
            }
        }
        return c.SetImageData(img);
    }
    exports.CreateBWImage = CreateBWImage;
    function ApplyAlphaMaskToImgData(original, alpha) {
        var _a = [original.width, original.height], width = _a[0], height = _a[1];
        var imgCopy = new ImageData(width, height);
        var buffer = imgCopy.data;
        buffer.set(original.data);
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var alphaInd = 4 * (width * y + x) + 3;
                buffer[alphaInd] = alpha[y][x] * 255;
            }
        }
        return imgCopy;
    }
    exports.ApplyAlphaMaskToImgData = ApplyAlphaMaskToImgData;
    var BinaryWriter = (function () {
        function BinaryWriter(buffer, littleEndian) {
            this.cursor = 0;
            this.littleEndian = true;
            this.buffer = buffer;
            this.littleEndian = littleEndian;
            this.view = new DataView(buffer.buffer);
        }
        BinaryWriter.prototype.Seek = function (cursor) {
            this.cursor = cursor;
        };
        BinaryWriter.prototype.Cursor = function () {
            return this.cursor;
        };
        BinaryWriter.prototype.WriteInt = function (val) {
            this.view.setInt32(this.cursor, val, this.littleEndian);
            this.cursor += 4;
        };
        BinaryWriter.prototype.WriteShort = function (val) {
            this.view.setInt16(this.cursor, val, this.littleEndian);
            this.cursor += 2;
        };
        BinaryWriter.prototype.WriteByte = function (val) {
            this.view.setUint8(this.cursor, val);
            this.cursor += 1;
        };
        BinaryWriter.prototype.BlockCopyArray = function (source) {
            this.buffer.set(source, this.cursor);
            this.cursor += source.length;
        };
        BinaryWriter.prototype.GetBuffer = function () {
            return this.buffer;
        };
        return BinaryWriter;
    }());
    function ImgData2URL(data) {
        var _a = [data.width, data.height], width = _a[0], height = _a[1];
        var headerSize = 14;
        var infoHeaderSize = 108;
        var imgDataSize = width * height * 4;
        var totalSize = imgDataSize + infoHeaderSize + headerSize;
        var bw = new BinaryWriter(new Uint8Array(totalSize), true);
        bw.WriteByte(0x42);
        bw.WriteByte(0x4D);
        bw.WriteInt(totalSize);
        bw.WriteShort(0);
        bw.WriteShort(0);
        var imgDataIndex = headerSize + infoHeaderSize;
        bw.WriteInt(imgDataIndex);
        bw.WriteInt(infoHeaderSize);
        bw.WriteInt(width);
        bw.WriteInt(-height);
        bw.WriteShort(1);
        var bitsPerPixel = 32;
        bw.WriteShort(bitsPerPixel);
        var BI_RGB = 0;
        var BI_BITFIELDS = 3;
        bw.WriteInt(BI_BITFIELDS);
        bw.WriteInt(imgDataSize);
        var inchesPerMetre = 39;
        var hRes = 72 * inchesPerMetre;
        var vRes = 72 * inchesPerMetre;
        bw.WriteInt(hRes);
        bw.WriteInt(vRes);
        var nColours = 0;
        bw.WriteInt(nColours);
        var importantColours = 0;
        bw.WriteInt(importantColours);
        var R_MASK = 0x00FF0000;
        var G_MASK = 0x0000FF00;
        var B_MASK = 0x000000FF;
        var A_MASK = 0xFF000000;
        bw.WriteInt(R_MASK);
        bw.WriteInt(G_MASK);
        bw.WriteInt(B_MASK);
        bw.WriteInt(A_MASK);
        var LCS_DEVICE_RGB = 1;
        bw.WriteInt(LCS_DEVICE_RGB);
        var CIEXYZTRIPLE_SIZE = 36;
        for (var i = 0; i < CIEXYZTRIPLE_SIZE; i++)
            bw.WriteByte(0);
        bw.WriteInt(0);
        bw.WriteInt(0);
        bw.WriteInt(0);
        bw.BlockCopyArray(data.data);
        var buffer = bw.GetBuffer();
        for (var i = imgDataIndex; i < buffer.length; i += 4) {
            var temp = buffer[i];
            buffer[i] = buffer[i + 2];
            buffer[i + 2] = temp;
        }
        var bmp = new Blob([buffer.buffer], { type: "image/bmp" });
        return URL.createObjectURL(bmp);
    }
    exports.ImgData2URL = ImgData2URL;
});
define("WebPage/Drawing2D", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FitToRectangle = exports.Points2Rect = exports.RelPos = exports.ClipRect = exports.RectB2Rect = exports.Rect2RectB = exports.origin = void 0;
    exports.origin = { x: 0, y: 0 };
    function Rect2RectB(rect) {
        return {
            left: rect.x,
            right: rect.x + rect.width,
            top: rect.y,
            bot: rect.y + rect.height
        };
    }
    exports.Rect2RectB = Rect2RectB;
    function RectB2Rect(rectB) {
        return {
            x: rectB.left,
            y: rectB.top,
            width: rectB.right - rectB.left,
            height: rectB.bot - rectB.top
        };
    }
    exports.RectB2Rect = RectB2Rect;
    function ClipRect(rect, boundary) {
        var rectB = Rect2RectB(rect);
        var boundaryB = Rect2RectB(boundary);
        var clippedB = {
            left: Math.max(rectB.left, boundaryB.left),
            right: Math.min(rectB.right, boundaryB.right),
            top: Math.max(rectB.top, boundaryB.top),
            bot: Math.min(rectB.bot, boundaryB.bot)
        };
        return RectB2Rect(clippedB);
    }
    exports.ClipRect = ClipRect;
    function RelPos(clientX, clientY, target) {
        var boundingBox = target.getBoundingClientRect();
        var relPoint = {
            x: clientX - boundingBox.x,
            y: clientY - boundingBox.y
        };
        return relPoint;
    }
    exports.RelPos = RelPos;
    function Points2Rect(p1, p2) {
        var _a = [Math.min(p1.y, p2.y), Math.min(p1.x, p2.x)], top = _a[0], left = _a[1];
        var _b = [Math.max(p1.y, p2.y), Math.max(p1.x, p2.x)], bot = _b[0], right = _b[1];
        var _c = [(bot - top), (right - left)], height = _c[0], width = _c[1];
        return {
            x: left,
            y: top,
            width: width,
            height: height
        };
    }
    exports.Points2Rect = Points2Rect;
    function FitToRectangle(maxWidth, maxHeight, imgWidth, imgHeight) {
        var _a = [maxWidth / imgWidth, maxHeight / imgHeight], xScale = _a[0], yScale = _a[1];
        var minScale = Math.min(xScale, yScale);
        var scale = ((minScale) < 1) ? minScale : 1.0;
        var w = imgWidth * scale;
        var h = imgHeight * scale;
        var x = (maxWidth - w) / 2;
        var y = (maxHeight - h) / 2;
        return { x: x, y: y, width: w, height: h };
    }
    exports.FitToRectangle = FitToRectangle;
});
define("WebPage/PreviewView", ["require", "exports", "WebPage/ImageUtil"], function (require, exports, IMUtil) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreviewView = void 0;
    var SelectedView;
    (function (SelectedView) {
        SelectedView[SelectedView["image"] = 0] = "image";
        SelectedView[SelectedView["alpha"] = 1] = "alpha";
    })(SelectedView || (SelectedView = {}));
    var PreviewView = (function () {
        function PreviewView(img, alphaBtn, imageBtn, download) {
            var _this = this;
            this.currentView = SelectedView.image;
            this.img = img;
            this.download = download;
            alphaBtn.addEventListener("click", function () { return _this.SwitchView(SelectedView.alpha); });
            imageBtn.addEventListener("click", function () { return _this.SwitchView(SelectedView.image); });
        }
        PreviewView.prototype.AttachEditorView = function (editorView) {
            this.editorView = editorView;
        };
        PreviewView.prototype.AttachModel = function (model) {
            this.model = model;
        };
        PreviewView.prototype.Draw = function () {
            var showAlphaMask = this.currentView == SelectedView.alpha;
            var src = this.model.GetCroppedImageURL(showAlphaMask);
            this.img.src = (src != null) ? src : IMUtil.EmptyImage();
            if (src != null) {
                this.download.setAttribute("href", src);
                this.download.setAttribute("download", (showAlphaMask) ? "mask.bmp" : "cropped.bmp");
            }
            else {
                this.download.removeAttribute("href");
            }
            var _a = this.editorView.GetPreviewDim(), width = _a[0], height = _a[1];
            this.img.style.width = width + "px";
            this.img.style.height = height + "px";
        };
        PreviewView.prototype.SwitchView = function (view) {
            if (this.currentView != view) {
                this.currentView = view;
                this.Draw();
            }
        };
        return PreviewView;
    }());
    exports.PreviewView = PreviewView;
});
define("WebPage/Transform", ["require", "exports", "Matrix", "WebPage/Drawing2D"], function (require, exports, M, Cam) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Apply2DTransform = exports.ChainTransform = exports.AffinePoint2Point = exports.Point2AffinePoint = exports.Translate2D = exports.Scale2D = exports.GetScalingFactor = exports.TransformRect = void 0;
    function Is3x3(mat) {
        return M.OfDimensions(mat, 3, 3);
    }
    function Is2DAffineColVector(mat) {
        return M.OfDimensions(mat, 3, 1);
    }
    function TransformRect(transform, rect) {
        var topLeft = { x: rect.x, y: rect.y };
        var botRight = { x: rect.x + rect.width, y: rect.y + rect.height };
        var transTopLeft = Apply2DTransform(topLeft, transform);
        var transBotRight = Apply2DTransform(botRight, transform);
        return Cam.Points2Rect(transTopLeft, transBotRight);
    }
    exports.TransformRect = TransformRect;
    function GetScalingFactor(affineMat) {
        return [affineMat[0][0], affineMat[1][1]];
    }
    exports.GetScalingFactor = GetScalingFactor;
    function Scale2D(xScale, yScale) {
        var trans = M.Identity(3);
        trans[0][0] = xScale;
        trans[1][1] = yScale;
        return trans;
    }
    exports.Scale2D = Scale2D;
    function Translate2D(xTranslation, yTranslation) {
        var trans = M.Identity(3);
        trans[0][2] = xTranslation;
        trans[1][2] = yTranslation;
        return trans;
    }
    exports.Translate2D = Translate2D;
    function Point2AffinePoint(point) {
        var m = M.CreateMatrix(3, 1);
        m[0][0] = point.x;
        m[1][0] = point.y;
        m[2][0] = 1;
        return m;
    }
    exports.Point2AffinePoint = Point2AffinePoint;
    function AffinePoint2Point(col) {
        if (!Is2DAffineColVector(col))
            throw new Error("Input needs to be a 3x1 column vector, actual:" + col);
        return {
            x: col[0][0],
            y: col[1][0]
        };
    }
    exports.AffinePoint2Point = AffinePoint2Point;
    function ChainTransform() {
        var transformations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            transformations[_i] = arguments[_i];
        }
        var not2DAffineTransform = transformations
            .filter(function (t) { return !Is3x3(t); })
            .length > 0;
        if (not2DAffineTransform)
            throw new Error("Transformations must be 3x3 2d affine transform matrices");
        var trans = M.Identity(3);
        for (var i = 0; i < transformations.length; i++) {
            trans = M.Mul(trans, transformations[i]);
        }
        return [trans, M.Inverse(trans)];
    }
    exports.ChainTransform = ChainTransform;
    function Apply2DTransform(point) {
        var transformations = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            transformations[_i - 1] = arguments[_i];
        }
        if (transformations.length == 0)
            return point;
        var _a = ChainTransform.apply(void 0, transformations), trans = _a[0], _ = _a[1];
        var prod = M.Mul(trans, Point2AffinePoint(point));
        return AffinePoint2Point(prod);
    }
    exports.Apply2DTransform = Apply2DTransform;
});
define("WebPage/DrawCall", ["require", "exports", "WebPage/Drawing2D", "WebPage/Transform"], function (require, exports, Cam, T) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SegmentDrawCall = exports.InvertedRectDrawCall = exports.HollowRectDrawCall = void 0;
    var HollowRectDrawCall = (function () {
        function HollowRectDrawCall(colour, width) {
            this.rect = null;
            this.colour = colour;
            this.width = width;
        }
        HollowRectDrawCall.prototype.SetPoints = function (p1, p2) {
            this.rect = Cam.Points2Rect(p1, p2);
        };
        HollowRectDrawCall.prototype.Draw = function (hDC) {
            if (this.rect == null)
                return;
            hDC.beginPath();
            hDC.strokeStyle = this.colour;
            hDC.lineWidth = this.width;
            var r = this.rect;
            hDC.rect(r.x, r.y, r.width, r.height);
            hDC.stroke();
        };
        HollowRectDrawCall.prototype.Transform = function (transform) {
            var scale = T.GetScalingFactor(transform)[0];
            var scaledWidth = this.width * scale;
            var transformed = new HollowRectDrawCall(this.colour, scaledWidth);
            transformed.rect = T.TransformRect(transform, this.rect);
            return transformed;
        };
        return HollowRectDrawCall;
    }());
    exports.HollowRectDrawCall = HollowRectDrawCall;
    var InvertedRectDrawCall = (function () {
        function InvertedRectDrawCall(colour) {
            this.rect = null;
            this.colour = colour;
        }
        InvertedRectDrawCall.prototype.SetPoints = function (p1, p2) {
            this.rect = Cam.Points2Rect(p1, p2);
        };
        InvertedRectDrawCall.prototype.Draw = function (hDC) {
            if (this.rect == null)
                return;
            var _a = [hDC.canvas.width, hDC.canvas.height], width = _a[0], height = _a[1];
            var rectB = Cam.Rect2RectB(this.rect);
            var leftRect = Cam.Points2Rect({ x: 0, y: 0 }, { x: rectB.left, y: height });
            var rightRect = Cam.Points2Rect({ x: rectB.right, y: 0 }, { x: width, y: height });
            var topRect = Cam.Points2Rect({ x: rectB.left, y: 0 }, { x: rectB.right, y: rectB.top });
            var botRect = Cam.Points2Rect({ x: rectB.left, y: rectB.bot }, { x: rectB.right, y: height });
            var drawRect = function (r) { return hDC.fillRect(r.x, r.y, r.width, r.height); };
            hDC.beginPath();
            hDC.fillStyle = this.colour;
            drawRect(leftRect);
            drawRect(rightRect);
            drawRect(topRect);
            drawRect(botRect);
            hDC.stroke();
        };
        InvertedRectDrawCall.prototype.Transform = function (transform) {
            var transformed = new InvertedRectDrawCall(this.colour);
            transformed.rect = T.TransformRect(transform, this.rect);
            return transformed;
        };
        return InvertedRectDrawCall;
    }());
    exports.InvertedRectDrawCall = InvertedRectDrawCall;
    var SegmentDrawCall = (function () {
        function SegmentDrawCall(start, width, colour, erase) {
            this.segments = [];
            this.widths = [];
            this.segments.push(start);
            this.widths.push(width);
            this.colour = colour;
            this.erase = erase;
        }
        SegmentDrawCall.prototype.AddEndPoint = function (next, width) {
            this.segments.push(next);
            this.widths.push(width);
        };
        SegmentDrawCall.prototype.Draw = function (hDC) {
            if (this.segments.length == 0)
                return;
            var originalCompositingMode = hDC.globalCompositeOperation;
            if (this.erase) {
                hDC.globalCompositeOperation = "destination-out";
            }
            hDC.beginPath();
            hDC.lineCap = "round";
            hDC.lineJoin = "round";
            hDC.strokeStyle = this.colour;
            hDC.moveTo(this.segments[0].x, this.segments[0].y);
            hDC.lineWidth = this.widths[0];
            for (var i = 1; i < this.segments.length; i++) {
                var seg = this.segments[i];
                hDC.lineTo(seg.x, seg.y);
                hDC.lineWidth = this.widths[i];
            }
            hDC.stroke();
            hDC.globalCompositeOperation = originalCompositingMode;
        };
        SegmentDrawCall.prototype.Transform = function (transform) {
            var transformed = new SegmentDrawCall(null, null, this.colour, this.erase);
            var scale = T.GetScalingFactor(transform)[0];
            transformed.widths = this.widths.map(function (w) { return w * scale; });
            transformed.segments = this.segments.map(function (seg) { return T.Apply2DTransform(seg, transform); });
            return transformed;
        };
        return SegmentDrawCall;
    }());
    exports.SegmentDrawCall = SegmentDrawCall;
});
define("WebPage/Model", ["require", "exports", "GrabCut", "WebPage/ImageUtil", "Utility", "Matrix"], function (require, exports, Cut, ImgUtil, Util, Mat) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Model = exports.BGColour = exports.FGColour = void 0;
    exports.FGColour = new ImgUtil.RGBA(255, 0, 0, 255);
    exports.BGColour = new ImgUtil.RGBA(0, 0, 255, 255);
    var Model = (function () {
        function Model() {
            this.croppedImage = null;
            this.croppedImageAlpha = null;
            this.canvasDrawOps = [];
            this.pendingDrawOps = null;
        }
        Model.prototype.BeginDrawCall = function (call) {
            this.pendingDrawOps = call;
            this.TriggerCanvasRedraw();
        };
        Model.prototype.UpdateDrawCall = function (call, finalize) {
            if (finalize === void 0) { finalize = false; }
            if (!finalize) {
                this.pendingDrawOps = call;
            }
            else {
                this.pendingDrawOps = null;
                this.canvasDrawOps.push(call);
            }
            this.TriggerCanvasRedraw();
        };
        Model.prototype.UndoLast = function () {
            if (this.pendingDrawOps != null) {
                this.pendingDrawOps = null;
            }
            else {
                if (this.canvasDrawOps.length == 0)
                    return;
                this.canvasDrawOps.pop();
            }
            this.TriggerCanvasRedraw();
        };
        Model.prototype.GetDrawOps = function (imgToDestTransform) {
            var last = (this.pendingDrawOps == null) ? [] : [this.pendingDrawOps];
            var merged = this.canvasDrawOps.concat(last);
            return merged.map(function (drawOp) { return drawOp.Transform(imgToDestTransform); });
        };
        Model.prototype.TriggerCanvasRedraw = function () {
            this.canvasView.Draw();
        };
        Model.prototype.AttachView = function (view) {
            this.canvasView = view;
        };
        Model.prototype.AttachPreviewView = function (preview) {
            this.preview = preview;
        };
        Model.prototype.ClearSelection = function () {
            this.pendingDrawOps = null;
            this.canvasDrawOps = [];
        };
        Model.prototype.SetImage = function (imageURL) {
            var _this = this;
            this.ClearSelection();
            this.croppedImage = null;
            this.croppedImageAlpha = null;
            var img = new Image();
            var fileURL = imageURL;
            var _ = new Promise(function (resolve) {
                img.onload = function () {
                    var height = img.naturalHeight;
                    var width = img.naturalWidth;
                    resolve([height, width]);
                };
                img.src = fileURL;
            }).then(function (dimensions) {
                var tempCanvas = document.createElement("canvas");
                tempCanvas.height = dimensions[0];
                tempCanvas.width = dimensions[1];
                var hDC = tempCanvas.getContext("2d");
                hDC.drawImage(img, 0, 0);
                _this.originalImageData = hDC.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                _this.originalImage = img;
                _this.TriggerCanvasRedraw();
                _this.preview.Draw();
            });
        };
        Model.prototype.GetImageDim = function () {
            return [this.originalImage.width, this.originalImageData.height];
        };
        Model.prototype.GetCoordSystem = function () {
            var _a = this.GetImageDim(), width = _a[0], height = _a[1];
            return { x: 0, y: 0, width: width, height: height };
        };
        Model.prototype.GetOriginalImage = function () {
            return this.originalImage;
        };
        Model.prototype.GetCroppedImageURL = function (alphaOnly) {
            if (alphaOnly)
                return this.croppedImageAlpha;
            else
                return this.croppedImage;
        };
        Model.prototype.GetTrimap = function () {
            var _a = this.GetImageDim(), width = _a[0], height = _a[1];
            var tempCanvas = new ImgUtil.Temp2DCanvas(width, height);
            var hDC = tempCanvas.GetHDC();
            var Identity = Mat.Identity(3);
            var ops = this.GetDrawOps(Identity);
            ops.forEach(function (op) { return op.Draw(hDC); });
            var imgData = tempCanvas.GetImageData();
            var trimap = Util.Fill2DObj(height, width, function () { return Cut.Trimap.Unknown; });
            var arr = imgData.data;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var offset = (y * width + x) * 4;
                    var r = arr[offset + 0];
                    var g = arr[offset + 1];
                    var b = arr[offset + 2];
                    var a = arr[offset + 3];
                    var pixelColour = new ImgUtil.RGBA(r, g, b, a);
                    var trimapValue = void 0;
                    if (pixelColour.Equals(exports.FGColour)) {
                        trimapValue = Cut.Trimap.Foreground;
                    }
                    else if (pixelColour.Equals(exports.BGColour)) {
                        trimapValue = Cut.Trimap.Background;
                    }
                    else {
                        trimapValue = Cut.Trimap.Unknown;
                    }
                    trimap[y][x] = trimapValue;
                }
            }
            return trimap;
        };
        Model.prototype.StartGrabCut = function (maxIter, tolerance) {
            var _a = this.GetImageDim(), width = _a[0], height = _a[1];
            var img = ImgUtil.ImageData2Mat(this.originalImageData);
            var cut = new Cut.GrabCut(img);
            var trimap = this.GetTrimap();
            cut.SetTrimap(trimap, width, height);
            cut.BeginCrop({ tolerance: tolerance, maxIterations: maxIter });
            var mask = cut.GetAlphaMask();
            var alphaApplied = ImgUtil.ApplyAlphaMaskToImgData(this.originalImageData, mask);
            this.croppedImage = ImgUtil.ImgData2URL(alphaApplied);
            this.croppedImageAlpha = ImgUtil.CreateBWImage(mask);
            this.preview.Draw();
        };
        return Model;
    }());
    exports.Model = Model;
});
define("WebPage/CanvasView", ["require", "exports", "WebPage/Transform"], function (require, exports, T) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CanvasView = void 0;
    var CanvasView = (function () {
        function CanvasView(imgCanvas, editingCanvas) {
            this.ZOOM_MAX = 2.0;
            this.ZOOM_MIN = 0;
            this.zoomFactor = 1.0;
            this.offsetX = 0;
            this.offsetY = 0;
            this.imgCanvas = imgCanvas;
            this.editingCanvas = editingCanvas;
            window.addEventListener("resize", this.Draw.bind(this));
        }
        CanvasView.prototype.AttachModel = function (model) {
            this.model = model;
        };
        CanvasView.prototype.GetMinScale = function () {
            var _a = [this.imgCanvas.width, this.imgCanvas.height], width = _a[0], height = _a[1];
            var _b = this.model.GetImageDim(), imgWidth = _b[0], imgHeight = _b[1];
            var minScale = Math.min((width / imgWidth), (height / imgHeight));
            minScale = Math.min(minScale, 1);
            return minScale;
        };
        CanvasView.prototype.GetPreviewDim = function () {
            var _a = this.model.GetImageDim(), imgWidth = _a[0], imgHeight = _a[1];
            var scale = this.GetMinScale();
            return [imgWidth * scale, imgHeight * scale];
        };
        CanvasView.prototype.ImgToCanvasTransform = function () {
            var _a = [this.imgCanvas.width, this.imgCanvas.height], cWidth = _a[0], cHeight = _a[1];
            var _b = this.model.GetImageDim(), imgWidth = _b[0], imgHeight = _b[1];
            var xOffset = cWidth * 0.5 - ((imgWidth + this.offsetX) * 0.5 * this.zoomFactor);
            var yOffset = cHeight * 0.5 - ((imgHeight + this.offsetY) * 0.5 * this.zoomFactor);
            var translation = T.Translate2D(xOffset, yOffset);
            var zoom = T.Scale2D(this.zoomFactor, this.zoomFactor);
            var _c = T.ChainTransform(translation, zoom), transform = _c[0], _ = _c[1];
            return transform;
        };
        CanvasView.prototype.Draw = function () {
            CanvasView.ResizeBufferToClientSize(this.editingCanvas);
            CanvasView.ResizeBufferToClientSize(this.imgCanvas);
            var _a = [this.imgCanvas.width, this.imgCanvas.height], width = _a[0], height = _a[1];
            var imgHDC = this.imgCanvas.getContext("2d");
            var editHDC = this.editingCanvas.getContext("2d");
            imgHDC.clearRect(0, 0, width, height);
            editHDC.clearRect(0, 0, width, height);
            var img = this.model.GetOriginalImage();
            if (img == null)
                return;
            var _b = this.model.GetImageDim(), imgWidth = _b[0], imgHeight = _b[1];
            this.zoomFactor = this.GetMinScale();
            var imgRect = { x: 0, y: 0, width: imgWidth, height: imgHeight };
            var imgToCanvas = this.ImgToCanvasTransform();
            var canvasImgRect = T.TransformRect(imgToCanvas, imgRect);
            imgHDC.drawImage(img, canvasImgRect.x, canvasImgRect.y, canvasImgRect.width, canvasImgRect.height);
            editHDC.save();
            var clipRegion = new Path2D();
            clipRegion.rect(canvasImgRect.x, canvasImgRect.y, canvasImgRect.width, canvasImgRect.height);
            editHDC.clip(clipRegion);
            var drawOps = this.model.GetDrawOps(imgToCanvas);
            drawOps.forEach(function (d) {
                d.Draw(editHDC);
            });
            editHDC.restore();
        };
        CanvasView.ResizeBufferToClientSize = function (canvas) {
            var _a = [canvas.scrollWidth, canvas.scrollHeight], srcWidth = _a[0], srcHeight = _a[1];
            var _b = [canvas.width, canvas.height], bufferWidth = _b[0], bufferHeight = _b[1];
            if (srcWidth != bufferWidth || srcHeight != bufferHeight) {
                canvas.width = srcWidth;
                canvas.height = srcHeight;
            }
        };
        return CanvasView;
    }());
    exports.CanvasView = CanvasView;
});
define("WebPage/ToolHandler", ["require", "exports", "WebPage/DrawCall", "WebPage/Drawing2D"], function (require, exports, Ed, Cam) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SegmentToolHandler = exports.InvertedRectToolHandler = exports.HollowRectToolHandler = void 0;
    var HollowRectToolHandler = (function () {
        function HollowRectToolHandler(colour, width) {
            var _this = this;
            if (colour === void 0) { colour = "red"; }
            if (width === void 0) { width = 2; }
            this.selStart = Cam.origin;
            this.selEnd = Cam.origin;
            this.rect = new Ed.HollowRectDrawCall(colour, width);
            [this.MouseDown, this.MouseDrag, this.MouseUp].forEach(function (fn) { return fn.bind(_this); });
        }
        HollowRectToolHandler.prototype.MouseDown = function (canvasPoint) {
            this.selStart = this.selEnd = canvasPoint;
            return this.UpdateRect();
        };
        HollowRectToolHandler.prototype.MouseDrag = function (canvasPoint) {
            this.selEnd = canvasPoint;
            return this.UpdateRect();
        };
        HollowRectToolHandler.prototype.MouseUp = function (canvasPoint) {
            this.selEnd = canvasPoint;
            return this.UpdateRect();
        };
        HollowRectToolHandler.prototype.UpdateRect = function () {
            this.rect.SetPoints(this.selStart, this.selEnd);
            return this.rect;
        };
        return HollowRectToolHandler;
    }());
    exports.HollowRectToolHandler = HollowRectToolHandler;
    var InvertedRectToolHandler = (function () {
        function InvertedRectToolHandler(colour) {
            var _this = this;
            this.p1 = Cam.origin;
            this.p2 = Cam.origin;
            this.invertedRect = null;
            this.invertedRect = new Ed.InvertedRectDrawCall(colour);
            [this.MouseDown, this.MouseDrag, this.MouseUp].forEach(function (fn) { return fn.bind(_this); });
        }
        InvertedRectToolHandler.prototype.MouseDown = function (canvasPoint) {
            this.p1 = this.p2 = canvasPoint;
            return this.GenRect();
        };
        InvertedRectToolHandler.prototype.MouseDrag = function (canvasPoint) {
            this.p2 = canvasPoint;
            return this.GenRect();
        };
        InvertedRectToolHandler.prototype.MouseUp = function (canvasPoint) {
            this.p2 = canvasPoint;
            return this.GenRect();
        };
        InvertedRectToolHandler.prototype.GenRect = function () {
            this.invertedRect.SetPoints(this.p1, this.p2);
            return this.invertedRect;
        };
        return InvertedRectToolHandler;
    }());
    exports.InvertedRectToolHandler = InvertedRectToolHandler;
    var SegmentToolHandler = (function () {
        function SegmentToolHandler(width, colour, erase) {
            var _this = this;
            this.segment = null;
            this.width = width;
            this.colour = colour;
            this.erase = erase;
            [this.MouseDown, this.MouseDrag, this.MouseUp].forEach(function (fn) { return fn.bind(_this); });
        }
        SegmentToolHandler.prototype.MouseDown = function (canvasPoint) {
            this.segment = new Ed.SegmentDrawCall(canvasPoint, this.width, this.colour, this.erase);
            return this.segment;
        };
        SegmentToolHandler.prototype.MouseDrag = function (canvasPoint) {
            this.segment.AddEndPoint(canvasPoint, this.width);
            return this.segment;
        };
        SegmentToolHandler.prototype.MouseUp = function (canvasPoint) {
            this.segment.AddEndPoint(canvasPoint, this.width);
            return this.segment;
        };
        return SegmentToolHandler;
    }());
    exports.SegmentToolHandler = SegmentToolHandler;
});
define("WebPage/Controller", ["require", "exports", "WebPage/Drawing2D", "WebPage/Model", "WebPage/ToolHandler", "Matrix", "WebPage/Transform"], function (require, exports, Cam, Model_1, Tools, Mat, T) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Controller = void 0;
    var LEFT_CLICK_FLAG = 1;
    var RIGHT_CLICK_FLAG = 2;
    var LEFT_CLICK_SINGLE = 0;
    var RIGHT_CLICK_SINGLE = 2;
    var MouseDebounce = (function () {
        function MouseDebounce() {
            this.MIN_DIST = 2;
            this.MIN_MILLIS = 100;
            this.lastTime = 0;
            this.lastX = 0;
            this.lastY = 0;
        }
        MouseDebounce.prototype.BeginMovement = function (x, y) {
            this.lastTime = window.performance.now();
            this.lastX = x;
            this.lastY = y;
        };
        MouseDebounce.prototype.AllowUpdate = function (x, y) {
            var currentMillis = window.performance.now();
            var diff = currentMillis - this.lastTime;
            var dist = Math.sqrt(Math.pow((this.lastX - x), 2) + Math.pow((this.lastY - y), 2));
            if (diff > this.MIN_MILLIS ||
                dist > this.MIN_DIST) {
                this.BeginMovement(x, y);
                return true;
            }
            else {
                return false;
            }
        };
        return MouseDebounce;
    }());
    var Controller = (function () {
        function Controller(file, canvas, cropBtn, brushRadioBtns, radiusRange, maxIter, tolerance) {
            this.toolHandler = null;
            this.debounce = new MouseDebounce();
            this.file = file;
            this.canvas = canvas;
            this.cropBtn = cropBtn;
            this.brushRadioBtns = brushRadioBtns;
            this.radiusRange = radiusRange;
            this.optMaxIter = maxIter;
            this.optTolerance = tolerance;
            canvas.addEventListener("mousedown", this.begin.bind(this));
            canvas.addEventListener("mousemove", this.drag.bind(this));
            canvas.addEventListener("mouseup", this.end.bind(this));
            canvas.addEventListener("contextmenu", function (e) { return e.preventDefault(); });
            document.addEventListener("keydown", this.Undo.bind(this));
            cropBtn.addEventListener("click", this.triggerGrabCut.bind(this));
        }
        Controller.prototype.AttachView = function (canvasView) {
            this.canvasView = canvasView;
        };
        Controller.prototype.AttachModel = function (model) {
            var _this = this;
            this.model = model;
            this.file.RegisterImageLoad(function () {
                _this.model.SetImage(_this.file.GetDataURL());
            });
        };
        Controller.prototype.triggerGrabCut = function () {
            var maxIter = this.optMaxIter.GetValue();
            var tol = this.optTolerance.GetValue();
            console.log("max:" + maxIter + ", tolerance:" + tol);
            this.model.StartGrabCut(maxIter, tol);
        };
        Controller.prototype.GetSelectedBrush = function () {
            var _this = this;
            var brushRadius = parseFloat(this.radiusRange.value);
            var invertedRectFactory = function () { return new Tools.InvertedRectToolHandler(Model_1.BGColour.CSSValue()); };
            var fgSegmentHandlerFactory = function () { return new Tools.SegmentToolHandler(brushRadius, Model_1.FGColour.CSSValue(), false); };
            var bgSegmentHandlerFactory = function () { return new Tools.SegmentToolHandler(brushRadius, Model_1.BGColour.CSSValue(), false); };
            var eraseHandlerFactory = function () { return new Tools.SegmentToolHandler(brushRadius, "white", true); };
            var nil = function () { };
            var clearAllSelections = function () { return _this.model.ClearSelection(); };
            var actionMappings = [
                { name: "fg-rect", drawHandlerFactory: invertedRectFactory, init: clearAllSelections },
                { name: "fg", drawHandlerFactory: fgSegmentHandlerFactory, init: nil },
                { name: "bg", drawHandlerFactory: bgSegmentHandlerFactory, init: nil },
                { name: "erase", drawHandlerFactory: eraseHandlerFactory, init: nil }
            ];
            var selected = this.brushRadioBtns.find(function (btn) { return btn.checked; });
            var actions = actionMappings.find(function (t) { return t.name == selected.value; });
            return actions;
        };
        Controller.prototype.Undo = function (e) {
            if (e.ctrlKey && e.key == "z") {
                this.model.UndoLast();
            }
        };
        Controller.prototype.Screen2Buffer = function (canvasPoint) {
            var _a = this.model.GetImageDim(), bufferWidth = _a[0], bufferHeight = _a[1];
            var bufferDim = { x: 0, y: 0, width: bufferWidth, height: bufferHeight };
            var img2Canvas = this.canvasView.ImgToCanvasTransform();
            var canvas2Img = Mat.Inverse(img2Canvas);
            return T.Apply2DTransform(canvasPoint, canvas2Img);
        };
        Controller.prototype.begin = function (e) {
            var leftPressed = e.button == LEFT_CLICK_SINGLE;
            if (!leftPressed)
                return;
            this.debounce.BeginMovement(e.clientX, e.clientY);
            var canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
            var start = this.Screen2Buffer(canvasPoint);
            var initActions = this.GetSelectedBrush();
            initActions.init();
            this.toolHandler = initActions.drawHandlerFactory();
            var drawCall = this.toolHandler.MouseDown(start);
            this.model.BeginDrawCall(drawCall);
        };
        Controller.prototype.drag = function (e) {
            var leftDown = e.buttons & LEFT_CLICK_FLAG;
            if (this.toolHandler == null || !leftDown)
                return;
            var notBebouncing = this.debounce.AllowUpdate(e.clientX, e.clientY);
            if (!notBebouncing)
                return;
            var canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
            var point = this.Screen2Buffer(canvasPoint);
            var drawCall = this.toolHandler.MouseDrag(point);
            this.model.UpdateDrawCall(drawCall, false);
        };
        Controller.prototype.end = function (e) {
            var leftReleased = e.button == LEFT_CLICK_SINGLE;
            if (this.toolHandler == null || !leftReleased)
                return;
            var canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
            var point = this.Screen2Buffer(canvasPoint);
            var drawCall = this.toolHandler.MouseUp(point);
            this.model.UpdateDrawCall(drawCall, true);
            this.toolHandler = null;
        };
        return Controller;
    }());
    exports.Controller = Controller;
});
define("WebPage/PageMain", ["require", "exports", "WebPage/FileInput", "WebPage/CanvasView", "WebPage/Model", "WebPage/Controller", "WebPage/PreviewView"], function (require, exports, FileInput_1, CanvasView_1, Model_2, Controller_1, PreviewView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var imgCanvas = document.getElementById("canvas-main");
    var editCanvas = document.getElementById("canvas-top");
    var cropBtn = document.getElementById("btn-crop");
    var previewImg = document.getElementById("img-preview");
    var btnAlpha = document.getElementById("btn-alpha");
    var btnImage = document.getElementById("btn-img");
    var download = document.getElementById("a-download");
    var radiusRange = document.getElementById("range-brush-size");
    var brushRadioBtns = Array.from(document.getElementsByName("brush"));
    var optMaxIter = new ValidatedTextbox("text-max-iter");
    var optTolerance = new ValidatedTextbox("text-iter-convergence");
    var file = new FileInput_1.FileInput("file-image");
    var view = new CanvasView_1.CanvasView(imgCanvas, editCanvas);
    var previewView = new PreviewView_1.PreviewView(previewImg, btnAlpha, btnImage, download);
    var model = new Model_2.Model();
    var controller = new Controller_1.Controller(file, imgCanvas, cropBtn, brushRadioBtns, radiusRange, optMaxIter, optTolerance);
    view.AttachModel(model);
    previewView.AttachModel(model);
    previewView.AttachEditorView(view);
    model.AttachView(view);
    model.AttachPreviewView(previewView);
    controller.AttachModel(model);
    controller.AttachView(view);
    console.log("Main loaded");
    console.log("PageMain loaded");
});
var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["Low"] = 0] = "Low";
    ErrorType[ErrorType["High"] = 1] = "High";
    ErrorType[ErrorType["NaN"] = 2] = "NaN";
    ErrorType[ErrorType["None"] = 3] = "None";
})(ErrorType || (ErrorType = {}));
var ValidatedTextbox = (function () {
    function ValidatedTextbox(id) {
        this.min = Number.MIN_SAFE_INTEGER;
        this.max = Number.MAX_SAFE_INTEGER;
        this.default = 0;
        this.tb = document.getElementById(id);
        if (!this.tb) {
            throw new Error("Missing input element:" + id);
        }
        this.default = this.parseAttrAsFloat("data-default");
        this.errClassName = this.tb.getAttribute("data-err-class");
        this.min = this.parseAttrAsFloat("min");
        this.max = this.parseAttrAsFloat("max");
        this.tb.addEventListener("input", this.CheckInput.bind(this));
    }
    ValidatedTextbox.Validate = function (raw, max, min) {
        var parsed = parseFloat(raw);
        if (isNaN(parsed))
            return ErrorType.NaN;
        if (parsed > max)
            return ErrorType.High;
        if (parsed < min)
            return ErrorType.Low;
        return ErrorType.None;
    };
    ValidatedTextbox.prototype.CheckInput = function () {
        var error = ValidatedTextbox.Validate(this.tb.value, this.max, this.min);
        if (error != ErrorType.None) {
            this.tb.classList.add(this.errClassName);
        }
        else {
            this.tb.classList.remove(this.errClassName);
        }
        this.tb.value = this.tb.value;
    };
    ValidatedTextbox.prototype.parseAttrAsFloat = function (attributeName) {
        var str = this.tb.getAttribute(attributeName);
        var parsed = parseFloat(str);
        var successful = !isNaN(parsed);
        if (!successful) {
            throw new Error("Error parsing attribute " + attributeName + " (value:" + str + ") as a number");
        }
        return parsed;
    };
    ValidatedTextbox.prototype.GetValue = function () {
        var err = ValidatedTextbox.Validate(this.tb.value, this.max, this.min);
        switch (err) {
            case ErrorType.None: {
                return parseFloat(this.tb.value);
            }
            case ErrorType.NaN: {
                return this.default;
            }
            case ErrorType.High: {
                return this.max;
            }
            case ErrorType.Low: {
                return this.min;
            }
            default: {
                throw new Error("Argument out of range");
            }
        }
    };
    return ValidatedTextbox;
}());
//# sourceMappingURL=out.js.map