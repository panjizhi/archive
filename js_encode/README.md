### JS Encode ###

对前端js脚本做混淆（js代码转换为6个字符的组合`![]+()`），多见于前端攻击、蓄意作弊等行为。

## 基本转换：##

- false       =>  ![]

- true        =>  !![]

- undefined   =>  [][[]]

- NaN         =>  +[![]]

- 0           =>  +[]

- 1           =>  +!+[]

- 2           =>  !+[]+!+[]

- 10          =>  [+!+[]]+[+[]]

- Array       =>  []

- Number      =>  +[]

- String      =>  []+[]

- Boolean     =>  ![]

- Function    =>  []["filter"]

- eval        =>  []["filter"]\["constructor"\]( CODE )()

- window      =>  []["filter"]\["constructor"\]("return this")()


*原文参考*

<http://www.jsfuck.com/>

*一个神奇的域名*
<http://xip.io/>

