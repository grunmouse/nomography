# Логаифм рациональных чисел

### Постановка задачи

$$\frac{a}{b} = x \left( \frac{c}{d}\right )^y $$
Дано:
$$ a \in \mathbb N; b \in \mathbb N $$
$$ c \in \mathbb N; d \in \mathbb N $$
Найти:
$$ y \in \mathbb Z; x > 0 $$

#### Выбор более простой подзадачи, к которой сводятся другие
Положим, что
$$c > d$$
Обратную ситуацию можно преобразовать возведением в -1 степень:
$$\frac{b}{a} = x^{-1} \left( \frac{d}{c}\right )^y $$



### Вывод формул

$$a d^y = x b c^y $$

#### Выражение $x$ через $y$
$$x(y) = \frac{a d ^y}{b c^y}$$
$$\Rightarrow x \in \mathbb Q$$

Целесообразно искать 
$$ x \in \left[1; \frac{c}{d} \right) %]$$

##### Вариант для $y<0$
$$x(y) = \frac{a c ^{-y}}{b d^{-y}}$$

#### Выражение $y$ черех $x$

$$\log_2( a d^y) = \log_2(x b c^y); $$
$$\log_2 a + y \log_2 d = \log_2 x + \log_2 b + y\log_2 c; $$
$$y \log_2 d -  y\log_2 c = \log_2 x + \log_2 b - \log_2 a; $$
$$y = \frac{ \log_2 x + \log_2 b - \log_2 a}{ \log_2 d - \log_2 c}. $$
Т.к. $c > d$, преобразуем формулу к виду с положительным знаменателем:

$$y = \frac{ -\log_2 x + \log_2 a - \log_2 b}{ \log_2 c - \log_2 d}. $$

#### Первое приближение $y$

Полагая, что $ x \in \left[1; \frac{c}{d} \right) %]$;

$$0 \le \log_2 x < \log_2 \frac{c}{d};$$
$$0 \le \log_2 x < \log_2 c - \log_2 d.$$

Логарифм $\log_2 x$ в $y(x)$ как линейный член со знаком минус, значит:

$$\frac{ \log_2 a - \log_2 b}{ \log_2 c - \log_2 d} \ge \frac{ -\log_2 x + \log_2 a - \log_2 b}{ \log_2 c - \log_2 d};$$
$$\frac{ -(\log_2 c - \log_2 d) + \log_2 a - \log_2 b}{ \log_2 c - \log_2 d} < \frac{ -\log_2 x + \log_2 a - \log_2 b}{ \log_2 c - \log_2 d}.$$

$$\frac{ -(\log_2 c - \log_2 d) + \log_2 a - \log_2 b}{ \log_2 c - \log_2 d} < y \le \frac{ \log_2 a - \log_2 b}{ \log_2 c - \log_2 d};$$
$$\frac{\log_2 a - \log_2 b}{ \log_2 c - \log_2 d} - 1 < y \le \frac{ \log_2 a - \log_2 b}{ \log_2 c - \log_2 d};$$

#### Условие найденного $y$

$$ 1 \le x < \frac{c}{d}; $$
$$ 1 \le \frac{a d ^y}{b c^y} < \frac{c}{d}; $$
$$\begin{cases}
	b c^y \le a d ^y,\\
	a d ^{y+1} < b c^{y+1}.
\end{cases}$$

##### Если $y<0$
$$b c^y \le a d ^y 
\Leftrightarrow
\frac{b}{c^{-y}} \le \frac{a}{d ^{-y }};$$
$$a d ^{y+1} < b c^{y+1} 
\Leftrightarrow
=\frac{a}{d ^{-y+1}} < \frac{b}{c^{-y+1}};
$$
$$-y+1 \le 0;$$
$$\begin{cases}
	b d^{-y} \le a c^{-y},\\
	a c^{1-y} < b d^{1-y}.
\end{cases}$$


### Вычисление приближенного $y$

Обозначим 
$$u = \frac{\log_2 a - \log_2 b}{ \log_2 c - \log_2 d}.$$

Положим, что 
$$\log_2 a - \log_2 b = p;$$
$$\log_2 c - \log_2 d = q.$$

Функция ilog2frac позволяет нам найти целые части $p$ и $q$.
Если целая часть равна нулю - то возможно преобразование дроби в число с плавающей точкой и применение функции log2.

#### Отношение

$$u = \frac{p}{q} = \frac{[p]+\{p\}}{[q]+\{q\}};$$

##### При $[p]=0$, $[q] = 0$:
$$u = \frac{\{p\}}{\{q\}};$$
Целочисленное вычисление невозможно, но, т.к. $1 \le \frac{a}{b} < 2$ и $1 \le \frac{c}{d} < 2$, возможно прямое вычисление по формуле
$$u = \frac{\log_2 \frac{a}{b}}{\log_2 \frac{c}{d}}$$

##### При $[p]=0$, $[q] \ne 0$:
$$u = \frac{\{p\}}{[q]+\{q\}};$$
$$[u] = 0.$$

##### При $[p]\ne 0$, $[q] = 0$:

$$u = \frac{[p]+\{p\}}{\{q\}};$$

Целочисленное вычисление невозможно, также невозможно вычисление $\{p\}$. Поэтому применяем оценку
$$\frac{[p]}{\{q\}} \le u < \frac{[p]+1}{\{q\}};$$

Возможно преобразование $\{q\}$ в рациональное число и вычисление пределов. При очень маленьком $\{q\}$ вилка может быть очень большой.
$$\lfloor \frac{[p]}{\{q\}} \rfloor \le u < \lceil \frac{[p]+1}{\{q\}} \rceil.$$

##### При $[p]\ne 0$, $[q] \ne 0$:

$$u = \frac{[p]+\{p\}}{[q]+\{q\}} = \frac{[p]}{[q]+\{q\}} + \frac{\{p\}}{[q]+\{q\}};$$
Пусть
$$v = \frac{[p]}{[q]+\{q\}};$$
$$w = \frac{\{p\}}{[q]+\{q\}};$$
тогда:
$$u = v + w.$$

$$[w] = 0; \{w\} = w.$$
$$\frac{[p]}{[q]+1} < v \le \frac{[p]}{[q]}.$$

$$[u] = [v] + [\{v\} + w]$$

$$\{v\} + w < 2$$

$$\lfloor \frac{[p]}{[q]+1} \rfloor < u < \lceil \frac{[p]}{[q]} \rceil + 2.$$
