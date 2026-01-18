function generateIntervalPermutations(n) {
    if (n <= 0) return [[]];

    const a = Array.from({ length: n }, (_, i) => i + 1);           // a1, a2, ..., an
    const b = Array.from({ length: n }, (_, i) => n + i + 1);       // b1, b2, ..., bn
    const result = [];

    // usedB[i] = true, если b[i] уже использован
    function backtrack(usedB, currentSeq) {
        if (currentSeq.length === 2 * n) {
            result.push([...currentSeq]);
            return;
        }

        // Сколько a уже добавлено?
        const nextAIndex = currentSeq.filter(x => x >= 1 && x <= n).length;

        // Если есть ещё не добавленные a — добавляем следующее a (в фиксированном порядке)
        if (nextAIndex < n) {
            const nextA = a[nextAIndex];
            currentSeq.push(nextA);
            backtrack(usedB, currentSeq);
            currentSeq.pop();
        }

        // Попробуем добавить любое ещё не использованное b[i], если его a[i] уже добавлен
        for (let i = 0; i < n; i++) {
            if (usedB[i]) continue; // b[i] уже использован
            if (!currentSeq.includes(a[i])) continue; // a[i] ещё не добавлен — нельзя добавлять b[i]

            currentSeq.push(b[i]);
            usedB[i] = true;
            backtrack(usedB, currentSeq);
            usedB[i] = false;
            currentSeq.pop();
        }
    }

    backtrack(new Array(n).fill(false), []);
    return result;
}

function renderPermutation(permut, n){
	return permut.map((code)=>(code>n ? `..${code-n})` : `(${code}..`)).join('');
}

function analyzeIntervalConfiguration(permutation, n) {
    // Проверка: длина 2n, все числа от 1 до 2n, без повторений
    if (permutation.length !== 2 * n) throw new Error("Длина должна быть 2n");
    const seen = new Set();
    for (const x of permutation) {
        if (x < 1 || x > 2 * n) throw new Error(`Недопустимое значение: ${x}`);
        if (seen.has(x)) throw new Error(`Дубликат: ${x}`);
        seen.add(x);
    }
    if (seen.size !== 2 * n) throw new Error("Не все числа от 1 до 2n присутствуют");

    // Для каждого отрезка i ∈ [1, n], находим позиции его начала (i) и конца (n+i)
    const segments = new Array(n);
    for (let i = 1; i <= n; i++) {
        const startPos = permutation.indexOf(i);       // начало отрезка i
        const endPos = permutation.indexOf(n + i);     // конец отрезка i
        // Независимо от порядка — отрезок покрывает интервал [min, max]
        segments[i - 1] = [Math.min(startPos, endPos), Math.max(startPos, endPos)];
    }

    // Построение графа пересечений
    const intersects = Array(n).fill().map(() => Array(n).fill(false));
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const [s1, e1] = segments[i];
            const [s2, e2] = segments[j];
            // Пересекаются, если есть общая точка
            if (s1 <= e2 && s2 <= e1) {
                intersects[i][j] = true;
                intersects[j][i] = true;
            }
        }
    }

    // DFS для компонент связности
    const visited = new Array(n).fill(false);
    let components = 0;

    function dfs(node) {
        visited[node] = true;
        for (let neighbor = 0; neighbor < n; neighbor++) {
            if (intersects[node][neighbor] && !visited[neighbor]) {
                dfs(neighbor);
            }
        }
    }

    for (let i = 0; i < n; i++) {
        if (!visited[i]) {
            components++;
            dfs(i);
        }
    }

    // Проверка: является ли граф кликой?
    let isClique = true;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (!intersects[i][j]) {
                isClique = false;
                break;
            }
        }
        if (!isClique) break;
    }

    if (components > 1) return 1;
    if (isClique) return 0;
    return 2;
}

function areas(permut, n){
	let result = Array.from({length:n}, ()=>({start:-1, end:-1}));
	for(let i = 0; i<permut.length; ++i){
		let code = permut[i];
		if(code>n){
			result[code-n-1].end = i;
		}
		else{
			result[code-1].start = i;
		}
	}
	
	return result;
}

const filter = (n)=>(permut)=>(analyzeIntervalConfiguration(permut,n)!==1);
const renrer = (n)=>(permut)=>(renderPermutation(permut,n));

let n = 3;
let result = generateIntervalPermutations(n);
// Вывод:
// [
//   [1, 2, 3, 4],   // a1, a2, b1, b2 → пересекаются
//   [1, 2, 4, 3],   // a1, a2, b2, b1 → b2 вложен в a1
//   [1, 3, 2, 4]    // a1, b1, a2, b2 → не пересекаются
// ]

//console.log(generateIntervalPermutations(3)); // Выведет: 15 (т.к. 5!! = 5×3×1 = 15)


console.table(result.filter(filter(n)).map(p=>(areas(p,n))));
