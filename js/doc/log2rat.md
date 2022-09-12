#### Целая часть разности логарифмов

$$\log_2 b = n;$$
$$\log_2 a = m;$$
$$p = \log_2 b - \log_2 a = n - m;$$

$$\begin{cases}
	[p] = [n] - [m], & \{n\} \ge \{m\},\\
	[p] = [n] - [m] - 1, & \{n\} < \{m\};
\end{cases}$$

$$\{n\} < \{m\}; \Leftrightarrow 2^{\{n\}} < 2^{\{m\}};$$

$$a = 2^{[m]+\{m\}}; \Leftrightarrow 2^{\{m\}} = \frac{a}{2^{[m]}};$$
$$b = 2^{[n]+\{n\}}; \Leftrightarrow 2^{\{n\}} = \frac{b}{2^{[n]}};$$

$$\{n\} < \{m\}; \Leftrightarrow \frac{b}{2^{[n]}} < \frac{a}{2^{[m]}};$$
$$\{n\} < \{m\}; \Leftrightarrow 2^{[m]} b < 2^{[n]} a.$$

##### Условие равенства нулю
$$[p] = 0$$
$$\begin{cases}
	[n] - [m] = 0, & \{n\} \ge \{m\},\\
	[n] - [m] = 1, & \{n\} < \{m\};
\end{cases}$$

$$\frac{b}{a} = \frac{2^n}{2^m} = 2^{n - m} = 2 ^{[n] - [m] + \{n\} - \{m\}};$$
$$\{n\} \ge \{m\} \Leftrightarrow 0 \le \{n\} - \{m\} \le \{n\} < 1;$$
$$\{n\} < \{m\}  \Leftrightarrow -1< -\{m\} \le \{n\} - \{m\} < 0;$$
$$\begin{cases}
	\frac{b}{a} = 2^{\{n\} - \{m\}}, & \{n\} \ge \{m\},\\
	\frac{b}{a} = 2^{1 + \{n\} - \{m\}}, & \{n\} < \{m\};
\end{cases}$$

$$\begin{cases}
	1 \le \frac{b}{a} < 2, & \{n\} \ge \{m\},\\
	1 < \frac{b}{a} < 2, & \{n\} < \{m\};
\end{cases}$$

Тогда:
$$ p = \{p\} = \log_2 \frac{b}{a}. $$