# capstone-NewsNow

# 📰 NewsNow (뉴스나우)
> **AI를 통한 정보 격차 해소: 전 연령층을 위한 맞춤형 뉴스 리팩토링 서비스**

<p align="center">
  <img src="https://img.shields.io/badge/Main_Language-Java-orange?style=flat-square&logo=Java"/>
  <img src="https://img.shields.io/badge/Framework-Spring_Boot-6DB33F?style=flat-square&logo=Spring-Boot"/>
  <img src="https://img.shields.io/badge/AI_Engine-Gemini_1.5_Flash-4285F4?style=flat-square&logo=Google-Gemini"/>
  <img src="https://img.shields.io/badge/Build-Gradle-02303A?style=flat-square&logo=Gradle"/>
  <br>
  <img src="https://img.shields.io/github/issues/geunpyoPark/capstone-NewsNow?style=flat-square"/>
  <img src="https://img.shields.io/github/stars/geunpyoPark/capstone-NewsNow?style=flat-square"/>
  <img src="https://img.shields.io/github/license/geunpyoPark/capstone-NewsNow?style=flat-square"/>
</p>

---

## 📌 1. 프로젝트 개요 (Project Overview)

"글자는 읽지만 뜻은 모르는" 이른바 **'실질적 문해력 저하'** 문제를 공학적으로 해결하고자 합니다. 

* **문제 정의**: 어려운 한자어와 전문 용어로 가득한 뉴스가 정보 격차를 심화시킵니다.
* **해결 방안**: AI(LLM)를 활용해 사용자의 어휘 수준에 맞춰 뉴스를 **실시간으로 리팩토링(Level 1~4)** 하여 제공합니다.

---

## ✨ 2. 핵심 기능 (Key Features)

| 기능 | 설명 | 담당 |
| :--- | :--- | :--- |
| **AI** | 뉴스 원문을 4단계 난이도로 실시간 재해석 | **박근표** |
| **Backend/Frontend** | 어려운 단어 클릭 시 맥락 기반 의미 제공 | **김해수** |
| **Backend/Data** | 뉴스 읽기 후 이해도 확인 및 정답률 분석 | **김유나** |
| **Word Scrap** | 나만의 시사 용어 사전 및 학습 리포트 | **공통** |

---

## 🛠 3. 기술 스택 (Tech Stack)

### **Frontend**
<img src="https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=React&logoColor=black"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=white"> <img src="https://img.shields.io/badge/React_Navigation-E5122E?style=for-the-badge&logo=React-Navigation&logoColor=white">
* **상태 관리 및 UI**: React Native 기반의 크로스 플랫폼 앱 구현
* **인증 서비스**: Google & Kakao OAuth 2.0 소셜 로그인 연동

### **Backend (Main & Auth)**
<img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=SpringBoot&logoColor=white"> <img src="https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=Java&logoColor=white"> <img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=SpringSecurity&logoColor=white">
* **메인 서버**: Spring Boot 기반의 비즈니스 로직 및 사용자 데이터 관리
* **보안**: Spring Security를 활용한 세션 및 권한 제어

### **AI & Data Engineering (Core)**
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=Python&logoColor=white"> <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white"> <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=GoogleGemini&logoColor=white"> <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=PyTorch&logoColor=white">
* **AI API Server**: **FastAPI**를 활용한 비동기 데이터 분석 및 서빙 엔진 구축
* **LLM**: Gemini 2.5 Flash 기반 뉴스 4단계 재구성 및 지능형 퀴즈 생성 로직
* **Image Gen**: `diffusers` 라이브러리를 활용한 뉴스 기반 입문자용 네컷 만화 생성 (R&D)
* **Crawling**: BeautifulSoup4를 활용한 네이버 뉴스 정밀 크롤링 파이프라인

### **Database & Infrastructure**
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=PostgreSQL&logoColor=white"> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=white"> <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=GitHubActions&logoColor=white">
* **Storage**: **JSONB** 데이터 타입을 활용한 비정형 AI 분석 결과 최적화 적재
* **DevOps**: Docker Compose를 통한 서비스 컨테이너화 및 개발 환경 표준화

---

## 👥 4. 팀원 소개 (Team Members)

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/geunpyoPark">
        <img src="https://github.com/geunpyoPark.png" width="100px;" alt="박근표"/><br />
        <sub><b>박근표 (팀장)</b></sub>
      </a><br />
      AI & Data Engine
    </td>
    <td align="center">
      <a href="https://github.com/해수아이디">
        <img src="https://github.com/해수아이디.png" width="100px;" alt="김해수"/><br />
        <sub><b>김해수</b></sub>
      </a><br />
      FE & BE Dev
    </td>
    <td align="center">
      <a href="https://github.com/유나아이디">
        <img src="https://github.com/유나아이디.png" width="100px;" alt="김유나"/><br />
        <sub><b>김유나</b></sub>
      </a><br />
      BE & Analysis
    </td>
  </tr>
</table>

---

## 📄 5. 라이선스 (License)
This project is licensed under the MIT License.
