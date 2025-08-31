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
choose monsters from db
quests from db?
functions for base and job separately cause often it uses explicitely one param as 0 and uses only result for one param

exp point - class associated get raw, get level

fix formatter and linter
Allow user to choose exp tables and rates
Different goals agnostic? Its kind of job 50 now only

Better metric - time to kill mob, do quest, number of quests
-Mark quests as intermediate, e.g. Siroma makes no sense without rachel sanc. But maybe it will be autosolved by above
Better UI
Toggle to allow some wasted exp fixed or % or max level
terminate early if also reached target level
prevent reaching higher than max level - from exp quest and monster kills
work with OVERLEVEL_PROTECTION


sort by estimated total kills but remove only by actual total kills
without metaling skips rachel sanc 2 - probably overleveling too much?
binary search tree for overlevel protection