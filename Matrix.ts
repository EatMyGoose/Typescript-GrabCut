export type Matrix = number[][];

//TODO: helper function for operating on arrays of matrices? (loops iterating through them will be slow)

export function Print(m: Matrix): string {
    let lines = m.map(r => "[" + r.join(',') + "]");
    return "[" + lines.join('\n') + "]";
}

export function Clone(m: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(m);
    let rows = new Array(nRows);
    for (let r = 0; r < nRows; r++) {
        rows[r] = m[r].slice(0);
    }
    return FromArray(rows);
}

export function OfDimensions(m: Matrix, nRows: number, nCols: number): boolean {
    return m.length == nRows && m[0].length == nCols;
}

export function Any(m: Matrix, fnPredicate: (element: number) => boolean): boolean {
    let [nRows, nCols] = Dimensions(m);
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            let e = m[r][c];
            if (fnPredicate(c)) return true;
        }
    }
    return false;
}

//Generates a Matrix containing random numbers uniformly distributed between lowerBound and upperBound
export function RandomFill(lowerBound: Matrix, upperBound: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(lowerBound);
    let random = CreateMatrix(nRows, nCols);
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            let lower = lowerBound[r][c];
            let upper = upperBound[r][c];
            random[r][c] = Math.random() * (upper - lower) + lower;
        }
    }
    return random;
}

export function Rows(m: Matrix): number {
    return m.length;
}

export function Columns(m: Matrix): number {
    return m[0].length;
}

export function CreateMatrix(rows: number, columns: number): Matrix {
    let mat = new Array(rows);
    for (let r = 0; r < rows; r++) {
        let newRow = new Array(columns);
        for (let c = 0; c < columns; c++) {
            newRow[c] = 0;
        }
        mat[r] = newRow;
    }
    return mat;
}

export function Norm(m: Matrix): number {
    let [rows, cols] = Dimensions(m);
    let nElems = rows * cols;
    let acc = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            acc += m[r][c] * m[r][c];
        }
    }
    return Math.pow(acc, 1 / nElems);
}

export function Identity(side: number): Matrix {
    let id = CreateMatrix(side, side);
    for (let i = 0; i < side; i++) {
        id[i][i] = 1;
    }
    return id;
}

export function NormSquare(m: Matrix): number {
    let [rows, cols] = Dimensions(m);
    let acc = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            acc += m[r][c] * m[r][c];
        }
    }
    return acc;
}

export function Dimensions(m: Matrix): number[] {
    return [Rows(m), Columns(m)];
}

export function IsSquare(m: Matrix): boolean {
    return Rows(m) == Columns(m);
}

export function FromArray(arr: number[][]): Matrix {
    return <Matrix>arr;
}

export function Mul(m1: Matrix, m2: Matrix): Matrix {
    let [nRows, nCols] = [m1.length, m2[0].length]; // Rows(m1), Columns(m2)
    let product: Matrix = CreateMatrix(nRows, nCols);
    let len = m1[0].length; //Columns(m1);
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            let acc = 0;
            for (let i = 0; i < len; i++) {
                acc += m1[r][i] * m2[i][c];
            }
            product[r][c] = acc;
        }
    }
    return product;
}

export function Transpose(m1: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(m1);
    let transposed = CreateMatrix(nCols, nRows);

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            transposed[c][r] = m1[r][c];
        }
    }
    return transposed;
}

export function Scale(scalar: number, m1: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(m1);
    let scaled = CreateMatrix(nRows, nCols);
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            scaled[r][c] = scalar * m1[r][c];
        }
    }
    return scaled;
}

export function Add(m1: Matrix, m2: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(m1);
    let sum: Matrix = CreateMatrix(nRows, nCols);

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            sum[r][c] = m1[r][c] + m2[r][c];
        }
    }
    return sum
}

export function AddInPlace(acc: Matrix, add: Matrix): void {
    let [nRows, nCols] = Dimensions(acc);
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            acc[r][c] += add[r][c]
        }
    }
}

export function Sub(m1: Matrix, m2: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(m1);
    let sum: Matrix = CreateMatrix(nRows, nCols);

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            sum[r][c] = m1[r][c] - m2[r][c];
        }
    }
    return sum;
}

export function AddScalar(scalar: number, m1: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(m1);
    let result: Matrix = CreateMatrix(nRows, nCols);

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            result[r][c] = m1[r][c] + scalar;
        }
    }
    return result;
}

export interface MeanAndCov {
    mean: Matrix;
    covariance: Matrix;
}

//Expects vectors as the input
export function MeanAndCovariance(data: Matrix[]): MeanAndCov {
    if (!IsVector(data[0])) throw Error("MeanAndCovariance: Vector input required");

    let [nRows, nCols] = Dimensions(data[0])
    let nData = data.length;
    //Mean
    let meanAcc = CreateMatrix(nRows, nCols);
    for (let i = 0; i < data.length; i++) {
        AddInPlace(meanAcc, data[i]);
    }
    let mean = Scale(1 / nData, meanAcc);

    //Covariance
    let side = Math.max(nRows, nCols);
    let covAcc = CreateMatrix(side, side);
    for (let i = 0; i < data.length; i++) {
        let diff = Sub(data[i], mean);
        let diffTransposed = Transpose(diff);
        let add = Mul(diff, diffTransposed);
        AddInPlace(covAcc, add);
    }
    let covariance = Scale(1 / nData, covAcc);

    return { mean: mean, covariance: covariance } as MeanAndCov;
}

//Expects vectors as the input
//Only processes data whose value in "labels" matches the value of tag at each index.
export function MeanAndCovarianceFromLabelledData(tag: number, labels: number[], data: Matrix[]): MeanAndCov {
    if (!IsVector(data[0])) throw Error("MeanAndCovariance: Vector input required");

    let [nRows, nCols] = Dimensions(data[0])
    let nData = 0;
    //Mean
    let meanAcc = CreateMatrix(nRows, nCols);
    for (let i = 0; i < data.length; i++) {
        if (labels[i] == tag) {
            AddInPlace(meanAcc, data[i]);
            nData++;
        }
    }

    let mean = Scale(1 / nData, meanAcc);

    //Covariance
    let side = Math.max(nRows, nCols);
    let covAcc = CreateMatrix(side, side);

    for (let i = 0; i < data.length; i++) {
        if (labels[i] == tag) {
            let diff = Sub(data[i], mean);
            let diffTransposed = Transpose(diff);
            let add = Mul(diff, diffTransposed);
            AddInPlace(covAcc, add);
        }
    }
    let covariance = Scale(1 / nData, covAcc);

    return { mean: mean, covariance: covariance } as MeanAndCov;
}

//Determinant of an NxN matrix
export function Determinant(m: Matrix): number {
    let square: boolean = IsSquare(m);
    if (!square) {
        let [nRows, nCols] = Dimensions(m);
        throw new Error(`Determinant: parameter is a non square matrix - rows:${nRows} colums:${nCols}`);
    }

    let size = Rows(m);
    switch (size) {
        case 1: {
            return m[0][0];
        }
        case 2: {
            return m[0][0] * m[1][1] - m[0][1] * m[1][0];
        }
        case 3: {
            let det1 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
            let det2 = m[1][0] * m[2][2] - m[1][2] * m[2][0];
            let det3 = m[1][0] * m[2][1] - m[1][1] * m[2][0];
            return m[0][0] * det1 - m[0][1] * det2 + m[0][2] * det3;
        }
        default: {
            let acc = 0;
            let even = true;

            for (let i = 0; i < size; i++) {
                let minor = SubMatrix(m, 0, i);
                acc += (even ? 1 : -1) * m[0][i] * Determinant(minor);
                even = !even;
            }
            return acc;
        }
    }
}

export function SubMatrix(m1: Matrix, row: number, col: Number): Matrix {
    let [nRows, nCols] = Dimensions(m1);
    let sub: number[][] = [];
    for (let r = 0; r < nRows; r++) {
        if (r == row) continue;
        let newRow = [];
        for (let c = 0; c < nCols; c++) {
            if (c == col) continue;
            newRow.push(m1[r][c]);
        }
        sub.push(newRow);
    }
    return FromArray(sub);
}

export function Cofactors(m1: Matrix): Matrix {
    let [nRows, nCols] = Dimensions(m1);
    let minors = CreateMatrix(nRows, nCols);
    for (let r = 0; r < nRows; r++) {
        //Rows alternate between starting pos & neg, first row is pos.
        let even = ((r & 1) == 0);
        for (let c = 0; c < nCols; c++) {
            let sub = SubMatrix(m1, r, c);
            let sign = even ? 1 : -1;
            even = !even;
            minors[r][c] = sign * Determinant(sub);
        }
    }
    return minors;
}

export function Inverse(m1: Matrix): Matrix {
    let square: boolean = IsSquare(m1);
    if (!square) {
        let [nRows, nCols] = Dimensions(m1);
        throw new Error(`Matrix Inverse: parameter is a non square matrix - rows:${nRows} colums:${nCols}`);
    }

    let size = Rows(m1);

    if (size == 1) {
        let adjugate = CreateMatrix(1, 1);
        adjugate[0][0] = 1.0 / m1[0][0];
        return adjugate;
    }

    let det = Determinant(m1);
    let cofactors = Cofactors(m1);

    //Swap to form adjugate
    let adjugate = Transpose(cofactors);

    return Scale(1.0 / det, adjugate);
}

export function MaxElement(m: Matrix): number {
    let [nRows, nCols] = Dimensions(m);
    let max = m[0][0]
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            max = Math.max(max, m[r][c]);
        }
    }
    return max;
}

export function IsColumnVector(m: Matrix): boolean {
    let [nRows, nCols] = Dimensions(m);
    return nCols == 1;
}

export function IsRowVector(m: Matrix): boolean {
    let [nRows, nCols] = Dimensions(m);
    return nRows == 1;
}

export function IsVector(m: Matrix): boolean {
    return IsColumnVector(m) || IsRowVector(m);
}

