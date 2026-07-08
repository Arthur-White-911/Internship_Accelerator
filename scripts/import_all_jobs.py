#!/usr/bin/env python3
"""将智联招聘和BOSS直聘苏州数据写入数据库"""

import json
import requests
from datetime import datetime

today = datetime.now().strftime("%Y-%m-%d")

def parse_salary(salary_text):
    """解析薪资范围，返回 (min, max) 元/月"""
    if not salary_text or salary_text in ("面议", ""):
        return None, None
    import re
    # "1.5-3万" / "2-4万"
    m = re.match(r"([\d.]+)[-~]([\d.]+)\s*万", salary_text)
    if m:
        return int(float(m.group(1)) * 10000), int(float(m.group(2)) * 10000)
    # "6000-12000元"
    m = re.match(r"(\d+)[-~](\d+)\s*元", salary_text)
    if m:
        return int(m.group(1)), int(m.group(2))
    # "150-250元/天" 折算月薪(×22天)
    m = re.match(r"(\d+)[-~](\d+)\s*元/天", salary_text)
    if m:
        return int(m.group(1)) * 22, int(m.group(2)) * 22
    # "9-14K" / "16-20K"
    m = re.match(r"([\d.]+)[-~]([\d.]+)\s*[Kk]", salary_text)
    if m:
        return int(float(m.group(1)) * 1000), int(float(m.group(2)) * 1000)
    return None, None

def extract_district(location):
    if not location:
        return "苏州"
    parts = location.replace("苏州·", "").split("·")
    return parts[0] if parts else "苏州"

def infer_campus_type(title, experience):
    """推断校招类型：返回 '实习岗' / '应届岗' / None(社招，跳过)"""
    exp = experience or ''

    # 实习岗：标题包含实习关键词
    if any(k in title for k in ['实习', '实习生', '实习岗']):
        return '实习岗'

    # 应届岗：标题包含应届/管培/校招关键词
    if any(k in title for k in ['应届', '应届生', '管培生', '校招', '届']):
        return '应届岗'

    # 经验要求为应届或不限：判断为应届岗
    if exp in ['应届', '在校/应届', '经验不限', '1年以内', '1年以下']:
        return '应届岗'

    # 经验要求 1-3 年及以上：社招，跳过
    if any(k in exp for k in ['1-3年', '3-5年', '5-10年', '10年以上']):
        return None

    # 默认归类为应届岗
    return '应届岗'


def infer_category(title, industry=""):
    t = title + industry
    if any(k in t for k in ["软件", "开发", "工程师", "程序", "前端", "后端", "测试", "运维", "IT", "技术", "算法", "视觉", "AI", "人工智能", "机器学习", "嵌入式", "数据"]):
        return "技术/IT"
    if any(k in t for k in ["销售", "顾问", "经纪", "业务"]):
        return "销售"
    if any(k in t for k in ["保险", "金融", "银行"]):
        return "金融/保险"
    if any(k in t for k in ["主播", "直播", "媒体", "传媒"]):
        return "媒体/传播"
    if any(k in t for k in ["行政", "助理", "人事", "HR"]):
        return "行政/人事"
    if any(k in t for k in ["设计", "UI", "美工"]):
        return "设计"
    if any(k in t for k in ["运营", "电商", "市场"]):
        return "运营/市场"
    if any(k in t for k in ["产品", "PM"]):
        return "产品"
    return "其他"

# ============ 智联招聘数据 ============
zhaopin_raw = [
    {"title": "软件测试工程师", "salary_text": "6000-11000元", "company": "陕西玄度智能科技有限公司", "company_type": "股份制企业", "company_size": "100-299人", "industry": "人工智能", "location": "苏州·太仓·娄东", "experience": "经验不限", "education": "本科"},
    {"title": "软件运维工程师（驻场）", "salary_text": "5000-6000元", "company": "清华苏州环境创新研究院", "company_type": "事业单位", "company_size": "100-299人", "industry": "学术/科研", "location": "苏州·虎丘·东渚", "experience": "经验不限", "education": "大专"},
    {"title": "信息科技岗（苏州虎丘）", "salary_text": "8000-10000元", "company": "安捷利美维电子(厦门)有限责任公司", "company_type": "国企", "company_size": "10000人以上", "industry": "半导体/芯片", "location": "苏州·虎丘·枫桥", "experience": "经验不限", "education": "本科"},
    {"title": "软件开发/软件测试（接受25届无经验）", "salary_text": "1.5-3万", "company": "外企德科数字技术有限公司", "company_type": "合资", "company_size": "10000人以上", "industry": "软件/IT服务", "location": "苏州·工业园区", "experience": "经验不限", "education": "本科"},
    {"title": "软件工程师", "salary_text": "150-160元/天", "company": "纳博特", "company_type": "民营", "company_size": "100-299人", "industry": "工业自动化/机器人", "location": "苏州·姑苏·白洋湾", "experience": "经验不限", "education": "本科"},
    {"title": "测试实习生", "salary_text": "3000-4000元", "company": "天合富家能源股份有限公司", "company_type": "民营", "company_size": "1000-9999人", "industry": "光伏", "location": "苏州·吴中·郭巷", "experience": "经验不限", "education": "大专"},
    {"title": "（软件测试培养）IT管培生", "salary_text": "5000-7000元", "company": "天阳科技", "company_type": "上市", "company_size": "1000-9999人", "industry": "软件/IT服务", "location": "苏州·吴中", "experience": "经验不限", "education": "本科"},
    {"title": "web前端开发实习生", "salary_text": "150-250元/天", "company": "苏州杄云互联科技有限公司", "company_type": "民营", "company_size": "20人以下", "industry": "软件/IT服务", "location": "苏州·常熟·东南", "experience": "经验不限", "education": "硕士"},
    {"title": "web前端开发工程师", "salary_text": "5000-9000元", "company": "广西海玺视讯传媒科技有限公司", "company_type": "民营", "company_size": "20人以下", "industry": "软件/IT服务", "location": "苏州·工业园区", "experience": "1-3年", "education": "大专"},
    {"title": "设备工程师（2026届）", "salary_text": "6000-8000元", "company": "扬子江药业集团", "company_type": "民营", "company_size": "10000人以上", "industry": "生物/制药", "location": "苏州·吴江·黎里", "experience": "经验不限", "education": "本科"},
    {"title": "软件测试员", "salary_text": "3000-5000元", "company": "越田(上海)信息科技有限公司常熟分公司", "company_type": "外商独资", "company_size": "20-99人", "industry": "软件/IT服务", "location": "苏州·常熟·琴川", "experience": "1年以下", "education": "大专"},
    {"title": "QT开发工程师", "salary_text": "7000-14000元", "company": "苏州冠锐信息科技有限公司", "company_type": "民营", "company_size": "20-99人", "industry": "软件/IT服务", "location": "苏州·吴中", "experience": "1-3年", "education": "大专"},
    {"title": "运维工程师（泛微OA）", "salary_text": "5000-7000元", "company": "安佑生物科技集团股份有限公司", "company_type": "外商独资", "company_size": "1000-9999人", "industry": "畜牧业", "location": "苏州·太仓·沙溪", "experience": "经验不限", "education": "本科"},
    {"title": "EHS初级助理", "salary_text": "8000-12000元", "company": "外企德科数字技术有限公司", "company_type": "合资", "company_size": "10000人以上", "industry": "软件/IT服务", "location": "苏州·工业园区", "experience": "1-3年", "education": "大专"},
    {"title": "地铁通信运维工程师", "salary_text": "5000-6000元", "company": "上海长合信息技术股份有限公司", "company_type": "民营", "company_size": "20-99人", "industry": "通信/网络设备", "location": "苏州·工业园区", "experience": "经验不限", "education": "大专"},
    {"title": "IDC运维值班员（实习生）", "salary_text": "150-200元/天", "company": "港城云联(苏州)数据系统有限公司", "company_type": "民营", "company_size": "100-299人", "industry": "云计算", "location": "苏州·张家港·乐余", "experience": "经验不限", "education": "大专"},
    {"title": "行政助理", "salary_text": "6000-12000元", "company": "中国人寿保险股份有限公司苏州市分公司", "company_type": "国企", "company_size": "10000人以上", "industry": "保险", "location": "苏州·姑苏·金阊", "experience": "经验不限", "education": "大专"},
    {"title": "2024届/2025届理工科应届生", "salary_text": "6000-8000元", "company": "名硕电脑", "company_type": "外商独资", "company_size": "10000人以上", "industry": "计算机硬件", "location": "苏州·虎丘·枫桥", "experience": "经验不限", "education": "本科"},
    {"title": "人事助理", "salary_text": "5000-8000元", "company": "中国人寿保险股份有限公司苏州市新区支公司", "company_type": "国企", "company_size": "10000人以上", "industry": "保险", "location": "苏州·相城·元和", "experience": "1-3年", "education": "大专"},
    {"title": "Java后端开发工程师", "salary_text": "1.2-2万", "company": "苏州思必驰信息科技有限公司", "company_type": "民营", "company_size": "500-999人", "industry": "人工智能", "location": "苏州·工业园区·独墅湖", "experience": "1-3年", "education": "本科"},
    {"title": "产品经理（实习）", "salary_text": "3000-5000元", "company": "苏州博众精工科技股份有限公司", "company_type": "上市", "company_size": "10000人以上", "industry": "工业自动化/机器人", "location": "苏州·吴中·木渎", "experience": "经验不限", "education": "本科"},
    {"title": "数据分析师", "salary_text": "8000-15000元", "company": "苏州工业园区服务外包职业学院", "company_type": "事业单位", "company_size": "500-999人", "industry": "教育", "location": "苏州·工业园区·唯亭", "experience": "1-3年", "education": "本科"},
    {"title": "UI设计师", "salary_text": "6000-10000元", "company": "苏州触动科技有限公司", "company_type": "民营", "company_size": "100-299人", "industry": "软件/IT服务", "location": "苏州·姑苏·平江", "experience": "1-3年", "education": "大专"},
    {"title": "算法工程师（机器视觉）", "salary_text": "1.5-3万", "company": "苏州天准科技股份有限公司", "company_type": "上市", "company_size": "500-999人", "industry": "半导体/芯片", "location": "苏州·工业园区·斜塘", "experience": "1-3年", "education": "本科"},
    {"title": "嵌入式软件工程师", "salary_text": "8000-15000元", "company": "苏州汇川技术有限公司", "company_type": "上市", "company_size": "10000人以上", "industry": "工业自动化/机器人", "location": "苏州·工业园区", "experience": "1-3年", "education": "本科"},
    {"title": "运营专员（新媒体）", "salary_text": "5000-8000元", "company": "苏州欢乐互娱网络科技有限公司", "company_type": "民营", "company_size": "100-299人", "industry": "互联网电商", "location": "苏州·工业园区·金鸡湖", "experience": "经验不限", "education": "大专"},
    {"title": "测试开发工程师", "salary_text": "1-1.8万", "company": "苏州科达科技股份有限公司", "company_type": "上市", "company_size": "1000-9999人", "industry": "通信/网络设备", "location": "苏州·高新区·枫桥", "experience": "1-3年", "education": "本科"},
    {"title": "人工智能实习生", "salary_text": "3000-6000元", "company": "苏州思必驰信息科技有限公司", "company_type": "民营", "company_size": "500-999人", "industry": "人工智能", "location": "苏州·工业园区·独墅湖", "experience": "经验不限", "education": "本科"},
    {"title": "市场营销专员", "salary_text": "5000-9000元", "company": "苏州工业园区星洲科技有限公司", "company_type": "民营", "company_size": "20-99人", "industry": "软件/IT服务", "location": "苏州·工业园区", "experience": "经验不限", "education": "大专"},
    {"title": "保险代理人", "salary_text": "6000-12000元", "company": "中国人寿保险股份有限公司苏州市分公司", "company_type": "国企", "company_size": "10000人以上", "industry": "保险", "location": "苏州·姑苏·金阊", "experience": "经验不限", "education": "大专"},
]

# ============ BOSS直聘数据 ============
boss_raw = [
    {"title": "机器视觉软件工程师", "salary_text": "9-14K", "company": "东声", "company_type": "民营", "company_size": "100-299人", "industry": "工业自动化/机器人", "location": "苏州·苏州工业园区·独墅湖", "experience": "1-3年", "education": "大专", "tags": ["视觉图像算法", "C++", "C#"]},
    {"title": "AI应用工程师", "salary_text": "12-15K", "company": "昆山台光电子材料", "company_type": "外商独资", "company_size": "1000-9999人", "industry": "半导体/芯片", "location": "苏州·昆山市·周市", "experience": "经验不限", "education": "本科", "tags": ["深度学习", "大模型算法", "强化学习"]},
    {"title": "视觉开发工程师", "salary_text": "10-11K", "company": "博富仕", "company_type": "民营", "company_size": "20-99人", "industry": "工业自动化/机器人", "location": "苏州·昆山市·玉山", "experience": "经验不限", "education": "本科", "tags": ["C/C++", "机器学习算法"]},
    {"title": "AI机器学习工程师", "salary_text": "16-20K", "company": "盖睿科技", "company_type": "民营", "company_size": "20-99人", "industry": "人工智能", "location": "苏州·吴中区·越溪", "experience": "3-5年", "education": "本科", "tags": ["大模型算法", "数据挖掘", "模型加速"]},
    {"title": "人工智能应用工程师（游戏方向）", "salary_text": "20-35K", "company": "蜗牛数字", "company_type": "上市", "company_size": "1000-9999人", "industry": "游戏", "location": "苏州", "experience": "3-5年", "education": "本科", "tags": ["深度学习", "大模型算法", "自然语言处理"]},
    {"title": "机器学习算法工程师", "salary_text": "12-20K", "company": "苏州汇编", "company_type": "民营", "company_size": "20-99人", "industry": "软件/IT服务", "location": "苏州·常熟市·碧溪镇", "experience": "1-3年", "education": "本科", "tags": ["深度学习", "大模型算法", "强化学习"]},
    {"title": "AIML数据工程师", "salary_text": "17-19K", "company": "天津智创新业科技", "company_type": "民营", "company_size": "100-299人", "industry": "软件/IT服务", "location": "苏州", "experience": "3-5年", "education": "大专", "tags": ["大模型算法", "图像算法", "数据挖掘"]},
    {"title": "视觉应用工程师（昆山）", "salary_text": "7-11K", "company": "麦克玛视", "company_type": "民营", "company_size": "20-99人", "industry": "工业自动化/机器人", "location": "苏州·昆山市·玉山", "experience": "3-5年", "education": "大专", "tags": ["视觉图像算法", "算法设计", "深度学习算法"]},
    {"title": "AI智能管培生（实习生）", "salary_text": "6-9K", "company": "苏州沧瀚", "company_type": "民营", "company_size": "20-99人", "industry": "人工智能", "location": "苏州·昆山市·开发区", "experience": "在校/应届", "education": "本科", "tags": ["团队管理", "图像算法", "深度学习"]},
    {"title": "机器视觉工程师", "salary_text": "11-20K", "company": "阿丘科技", "company_type": "民营", "company_size": "100-299人", "industry": "人工智能", "location": "苏州·昆山市·世茂", "experience": "3-5年", "education": "本科", "tags": ["C/C++", "算法工程化"]},
    {"title": "机器学习算法工程师", "salary_text": "15-30K", "company": "联滔电子", "company_type": "外商独资", "company_size": "10000人以上", "industry": "计算机硬件", "location": "苏州", "experience": "3-5年", "education": "本科", "tags": ["Java", "图像算法", "团队管理"]},
    {"title": "算法工程师", "salary_text": "15-25K", "company": "固德威", "company_type": "上市", "company_size": "1000-9999人", "industry": "电气/电力/新能源", "location": "苏州·虎丘区·木渎", "experience": "5-10年", "education": "本科", "tags": ["强化学习", "深度学习", "运筹优化"]},
    {"title": "算法开发工程师", "salary_text": "15-20K", "company": "苏州某大型半导体芯片上市公司", "company_type": "上市", "company_size": "10000人以上", "industry": "半导体/芯片", "location": "苏州", "experience": "1-3年", "education": "本科", "tags": []},
    {"title": "机器学习工程师", "salary_text": "10-15K", "company": "苏州杰尚信息技术", "company_type": "民营", "company_size": "20-99人", "industry": "软件/IT服务", "location": "苏州", "experience": "1-3年", "education": "本科", "tags": []},
    {"title": "视觉应用工程师", "salary_text": "8-12K", "company": "简博斯", "company_type": "民营", "company_size": "20-99人", "industry": "工业自动化/机器人", "location": "苏州·苏州工业园区·跨塘", "experience": "在校/应届", "education": "大专", "tags": []},
    {"title": "嵌入式开发工程师", "salary_text": "10-18K", "company": "苏州汇川技术有限公司", "company_type": "上市", "company_size": "10000人以上", "industry": "工业自动化/机器人", "location": "苏州·工业园区", "experience": "1-3年", "education": "本科", "tags": ["C/C++", "Linux", "RTOS"]},
]

# 构建统一 jobs 数组（只包含校招岗位）
jobs = []
skipped_zhaopin = 0
skipped_boss = 0

for job in zhaopin_raw:
    campus_type = infer_campus_type(job["title"], job.get("experience", ""))
    if campus_type is None:
        skipped_zhaopin += 1
        continue  # 跳过社招岗位
    salary_min, salary_max = parse_salary(job["salary_text"])
    jobs.append({
        "title": job["title"],
        "company": job["company"],
        "salary_text": job["salary_text"],
        "salary_min": salary_min,
        "salary_max": salary_max,
        "district": extract_district(job["location"]),
        "experience": job.get("experience", "经验不限"),
        "education": job.get("education", "学历不限"),
        "category": infer_category(job["title"], job.get("industry", "")),
        "job_type": campus_type,    # 实习岗 / 应届岗
        "campus_type": campus_type, # 同步写入 campus_type 字段
        "publish_date": today,
        "source_url": "https://www.zhaopin.com/sou/jl639/",
        "source_platform": "智联招聘",
        "tags": [],
        "company_size": job.get("company_size", ""),
        "company_type": job.get("company_type", ""),
        "industry": job.get("industry", ""),
        "location": job.get("location", "苏州"),
    })

for job in boss_raw:
    campus_type = infer_campus_type(job["title"], job.get("experience", ""))
    if campus_type is None:
        skipped_boss += 1
        continue  # 跳过社招岗位
    salary_min, salary_max = parse_salary(job["salary_text"])
    jobs.append({
        "title": job["title"],
        "company": job["company"],
        "salary_text": job["salary_text"],
        "salary_min": salary_min,
        "salary_max": salary_max,
        "district": extract_district(job["location"]),
        "experience": job.get("experience", "经验不限"),
        "education": job.get("education", "学历不限"),
        "category": infer_category(job["title"], job.get("industry", "")),
        "job_type": campus_type,    # 实习岗 / 应届岗
        "campus_type": campus_type, # 同步写入 campus_type 字段
        "publish_date": today,
        "source_url": "https://www.zhipin.com/web/geek/jobs?city=101190400",
        "source_platform": "BOSS直聘",
        "tags": job.get("tags", []),
        "company_size": job.get("company_size", ""),
        "company_type": job.get("company_type", ""),
        "industry": job.get("industry", ""),
        "location": job.get("location", "苏州"),
    })

print(f"智联招聘: 共 {len(zhaopin_raw)} 条，过滤社招 {skipped_zhaopin} 条")
print(f"BOSS直聘: 共 {len(boss_raw)} 条，过滤社招 {skipped_boss} 条")
print(f"准备写入校招岗位: {len(jobs)} 条")

payload = {
    "jobs": jobs,
    "scrape_date": today,
    "source_summary": {
        "zhaopin_count": len(zhaopin_raw),
        "boss_count": len(boss_raw)
    }
}

try:
    resp = requests.post(
        "http://47.111.25.198:3001/api/jobs/batch",
        json=payload,
        timeout=60
    )
    result = resp.json()
    print(f"状态码: {resp.status_code}")
    print(f"写入结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
except Exception as e:
    print(f"请求失败: {e}")
