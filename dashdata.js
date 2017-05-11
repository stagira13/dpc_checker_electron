"use strict";

const compare_byoto = "WITH dsum AS ( select 病棟コード,sum(行為点数*行為回数) AS DPC総点数 \
						from dtable \
						where データ区分 <> 97 \
						group by 病棟コード), \
						efsum AS( \
						SELECT 病棟コード,SUM(出来高実績点数*行為回数) AS 出来高総点数 \
						FROM etable \
						WHERE データ区分 <> 92 \
						AND データ区分 <> 97 \
						AND 行為明細区分情報 LIKE '__0_________' \
						group by 病棟コード) \
						select distinct 病棟コード, \
						d.DPC総点数,e.出来高総点数,d.DPC総点数-e.出来高総点数 AS 出来高対比 \
						from dsum AS d \
						INNER JOIN efsum AS e \
						USING(病棟コード);"
const compare_ka = "WITH dsum AS ( select 診療科区分,sum(行為点数*行為回数) AS DPC総点数 \
						from dtable \
						where データ区分 <> 97 \
						group by 診療科区分), \
						efsum AS( SELECT 診療科区分,SUM(出来高実績点数*行為回数) AS 出来高総点数 \
						FROM etable \
						WHERE データ区分 <> 92 \
						AND データ区分 <> 97 \
						AND 行為明細区分情報 LIKE '__0_________' \
						group by 診療科区分) \
						select distinct 診療科区分, \
						d.DPC総点数,e.出来高総点数,d.DPC総点数-e.出来高総点数 AS 出来高対比 \
						from dsum AS d \
						INNER JOIN efsum AS e \
						USING(診療科区分);"
const Percent_ka = 'SELECT 診療科区分,sum(行為点数*行為回数) AS DPC総点数 \
                      from dtable \
                      Where データ区分 <> 97 \
                      GROUP BY 診療科区分'
const Percent_byoto = 'SELECT 病棟コード,sum(行為点数*行為回数) AS DPC総点数 \
                      from dtable \
                      Where データ区分 <> 97 \
                      GROUP BY 病棟コード'
const mdc2_dpcsum = 'SELECT substr(分類番号,1,2) AS MDC2,sum(行為点数*行為回数) AS DPC総点数 \
					from dtable \
					Where データ区分 = 93 \
					group by substr(分類番号,1,2)'
const ka_dpcsum = 'SELECT 診療科区分,sum(行為点数*行為回数) AS DPC総点数 \
					from dtable \
					Where データ区分 = 93 \
					group by 診療科区分'


const dash_querys = {"compare_byoto":compare_byoto,"compare_ka":compare_ka,
    "Percent_ka":Percent_ka,"Percent_byoto":Percent_byoto,"mdc2_dpcsum":mdc2_dpcsum,
    "ka_dpcsum":ka_dpcsum}

module.exports = dash_querys;
// うーん。db.allは向こう側でかませるべきだな



