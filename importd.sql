.separator "\t"
.import DRGD.txt dtable
UPDATE dtable SET 行為点数 = 行為点数 * 医療機関係数 Where データ区分 = 93;
.exit