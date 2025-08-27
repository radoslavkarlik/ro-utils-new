better kills metric, this will skip base epx quests because they didnt decrease total kills (same job exp at the end) but higher level means faster killing of mobs
--maybe enough that exp quests were earlier in the steps before monsters.. same total but monster after quest means better.. maybe just count indexes

s rate 0.95 uz zabijal muky do lvl 50, pod 1 sa pokazi

also explore of possibility of skipping some quests? cause it tries to do all and then terminate if reached job 50

if monster prerequisites were done, then dont finish until the dependend quest is done otherwise they are wasted. Maybe can straight up remove itself and not queue others

ore 0.5 skipol questy, je to spravne?

create instance with rates, charts etc

test journey from a fixed point.. e.g. for checking progress and overlevel from that one

add batch quest warning

binary tree search for level based on exp? other optimizations
allow split of batched quests - just consider them as separate quests

save reason why certain step was made - eg prevent overleveling, reach next target monster, etc
logic tests
refactor
code quality
better global flags handling - rates etc
choose correctly dataset baseexp, jobexp
choose monsters from db
quests from db?
functions for base and job separately cause often it uses explicitely one param as 0 and uses only result for one param

exp point - class associated get raw, get level

toggle to allow some wasted exp fixed or % or max level

optimize will overlevel - can probably be replaced with cap exp reward and compare

goal 50 job



fix formatter and linter

.....

ignores monster switch quest prereq
ignores quest prereqs???
add time metric, like how long it takes to kill mobs and rather use that instead of total kills
..either this or disallow intermediate quests on their own.. e.g. siroma killing only without rachel sanc.