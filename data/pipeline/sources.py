"""Every external file the pipeline touches, with provenance.

Nothing in public/data is hand-typed from these sources: each file is downloaded by
download.py, hashed into data/raw/MANIFEST.json and parsed by the step named below.
"""

SOURCES = {
    "aps_employment": {
        "file": "aps_soc2020_a25m26.xlsx",
        "url": "https://www.ons.gov.uk/file?uri=/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/adhocs/35014digitoccupationalcodingsocbyagehighestqualificationsex4digitindustrysicanditl3regionukapril2025tomarch2026/4digitoccupationbyvariousfactorsa25m26.xlsx",
        "landing": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/adhocs/35014digitoccupationalcodingsocbyagehighestqualificationsex4digitindustrysicanditl3regionukapril2025tomarch2026",
        "title": "4-digit occupational coding (SOC 2020) by age, highest qualification, sex, industry and ITL3 region, UK, April 2025 to March 2026",
        "publisher": "Office for National Statistics (Annual Population Survey)",
        "licence": "Open Government Licence v3.0",
        "used_for": "UK employment count per SOC 2020 unit group (men + women, main job)",
        "step": "employment.py",
    },
    "dfe_aioe": {
        "file": "dfe_annex1.xlsx",
        "url": "https://assets.publishing.service.gov.uk/media/65575c92046ed400148b9ad1/Annex_1_-_Impact_of_AI_on_UK_jobs_and_training_data_sources.xlsx",
        "landing": "https://www.gov.uk/government/publications/the-impact-of-ai-on-uk-jobs-and-training",
        "title": "The impact of AI on UK jobs and training, Annex 1: data sources (AI Occupational Exposure by SOC 2010)",
        "publisher": "Department for Education, Unit for Future Skills (28 November 2023), applying Felten, Raj and Seamans' AIOE index",
        "licence": "Open Government Licence v3.0",
        "used_for": "Headline exposure score (AIOE, all 10 AI applications) and the LLM-only variant, per SOC 2010 unit group",
        "step": "exposure.py",
    },
    "soc2010_soc2020_map": {
        "file": "soc2010_to_soc2020.xlsx",
        "url": "https://www.ons.gov.uk/file?uri=/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020/therelationshipbetweenstandardoccupationalclassification2010andstandardoccupationalclassification2020/soc2010soc2020relationshiptablesjuly2021.xlsx",
        "landing": "https://www.ons.gov.uk/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020/therelationshipbetweenstandardoccupationalclassification2010andstandardoccupationalclassification2020",
        "title": "The relationship between SOC 2010 and SOC 2020: unit group relationship tables (July 2021)",
        "publisher": "Office for National Statistics",
        "licence": "Open Government Licence v3.0",
        "used_for": "Employment-weighted crosswalk from SOC 2010 scores to SOC 2020 unit groups",
        "step": "exposure.py",
    },
    "ons_automation": {
        "file": "automationreferencetables.xls",
        "url": "https://www.ons.gov.uk/file?uri=/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/datasets/probabilityofautomationinengland/2011and2017/automationreferencetables.xls",
        "landing": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/datasets/probabilityofautomationinengland",
        "title": "The probability of automation in England: 2011 and 2017, reference tables (Table 9, SOC 2010 4-digit)",
        "publisher": "Office for National Statistics (25 March 2019)",
        "licence": "Open Government Licence v3.0",
        "used_for": "Secondary 'old-school automation' probability shown in the methodology, not the headline score",
        "step": "exposure.py",
    },
    "soc2020_vol1": {
        "file": "soc2020_vol1.xlsx",
        "url": "https://www.ons.gov.uk/file?uri=/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020/soc2020volume1structureanddescriptionsofunitgroups/soc2020volume1structureanddescriptionofunitgroupsexcel20260827.xlsx",
        "landing": "https://www.ons.gov.uk/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020/soc2020volume1structureanddescriptionsofunitgroups",
        "title": "SOC 2020 Volume 1: structure and descriptions of unit groups (August 2026 revision)",
        "publisher": "Office for National Statistics",
        "licence": "Open Government Licence v3.0",
        "used_for": "Canonical unit group titles, the typical tasks of each occupation, and related job titles",
        "step": "tasks_aliases.py",
    },
    "soc2020_vol2_index": {
        "file": "soc2020_vol2_index.xlsx",
        "url": "https://www.ons.gov.uk/file?uri=/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020/soc2020volume2codingrulesandconventions/soc2020volume2thecodingindexexcel20260827v2.xlsx",
        "landing": "https://www.ons.gov.uk/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020/soc2020volume2codingrulesandconventions",
        "title": "SOC 2020 Volume 2: the coding index (version 14, August 2026)",
        "publisher": "Office for National Statistics",
        "licence": "Open Government Licence v3.0",
        "used_for": "Search aliases: the job titles the ONS itself codes to each unit group",
        "step": "tasks_aliases.py",
    },
}
