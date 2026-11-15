# 0chae.exe

https://seoyc0219.github.io/

Code, Security & Little Notes. 레트로 컴퓨터와 인터랙티브 미니룸 디자인의 Jekyll 블로그입니다. 개발 · 보안 · 기타. 카테고리를 사용합니다.

## GitHub에서 글 쓰기

1. 저장소의 `_posts` 폴더에서 **Add file → Create new file**을 선택합니다.
2. 파일 이름을 `YYYY-MM-DD-english-slug.md` 형식으로 적습니다. YYYY-MM-DD는 실제 게시 날짜로 바꿉니다. 주소에 사용할 뒷부분은 영문 소문자와 하이픈을 권장합니다.
3. 아래 내용을 붙여 넣고 제목과 본문을 작성합니다.
4. **Commit changes**로 main 브랜치에 저장합니다. **Actions → pages build and deployment**가 성공하면 사이트에 자동 반영됩니다.

```markdown
---
title: "글 제목"
category: 개발
description: "글 목록에 보여줄 짧은 소개"
---

## 소제목

여기부터 본문을 Markdown으로 작성합니다.

**굵게**, *기울임*, [링크](https://github.com/seoyc0219)를 쓸 수 있습니다.

- 첫 번째 항목
- 두 번째 항목
```

- `category`는 `개발`, `보안`, `"기타."` 중 하나로 적습니다.
- 날짜는 파일명에서 자동으로 가져옵니다. 미래 날짜의 글은 게시되지 않습니다. 시간대는 한국(Asia/Seoul)입니다.
- `description`은 생략할 수 있습니다. 생략하면 본문 앞부분이 요약으로 표시됩니다.
- 초안은 상단 설정에 `published: false`를 추가하면 공개되지 않습니다.
- 같은 카테고리를 다시 누르면 필터가 해제되어 모든 글을 볼 수 있습니다.

### 이미지

`assets/images`에 이미지 파일을 올린 후 본문에서 다음처럼 씁니다.

```markdown
![이미지 설명](/assets/images/photo.png)
```

### 코드 블록

세 개의 백틱 뒤에 언어 이름을 적습니다.

````markdown
```python
print("Hello!")
```
````

## 미니룸 사용법

- 노트북/책상: 실제 Markdown 기술 글 목록으로 이동
- 책장의 책: 방명록 창 열기
- 작은 벌레: SQL Injection, DOM XSS, 객체별 권한 검사(IDOR) 취약점 찾기 게임
- 미니룸 꾸미기: 가구를 드래그하거나 가구 선택 후 방향키로 이동 (Shift + 방향키로 크게 이동)
- 오른쪽 아이템: 가구 추가, 선택 삭제, 기본 배치로 복원
- 배치 저장: 이 브라우저의 localStorage에 저장. 꾸미기 마치기를 눌러도 저장됩니다.

### 공유 방명록과 게임 보상

- 방명록은 로그인 없이 닉네임과 내용으로 등록합니다. 서버의 D1 데이터베이스에 보관되어 다른 방문자와 다른 기기에서도 볼 수 있습니다.
- 방명록 창에서 새로고침하거나 이전 글 더 보기를 눌러 공유 글을 확인합니다.
- 글을 작성한 브라우저에는 해당 글의 삭제 권한만 보관합니다. 브라우저 데이터를 지워도 공개 글은 남지만, 해당 브라우저의 삭제 권한은 사라질 수 있습니다.
- 방 배치는 계속 각자의 브라우저에만 저장됩니다. 다른 사람의 방 배치를 바꾸지 않습니다.
- 취약점 찾기 세 문제를 완료하면 보상 화면이 열리고 BUG HUNTER 배지와 별 프레임이 해제됩니다. 방명록 꾸미기에서 선택해서 등록하면 다른 방문자에게도 보입니다.
- 보상 해제와 최고 점수는 해당 브라우저에 저장됩니다. 다시 풀기는 명시적으로 선택할 때만 시작합니다. 배지는 꾸미기 보상입니다.
- 의자·식물·침대·조명은 장식이며 클릭하면 문구를 표시합니다. 꾸미기 모드에서는 이동/추가/삭제할 수 있습니다.

방명록 API: https://ochae-guestbook.vigilantclef2.chatgpt.site/api/guestbook
Sites에서 운영하는 공개 저장 서버이며, 블로그 자체는 GitHub Pages/Jekyll을 유지합니다. 서버 소스는 `0chae.exe 방명록` Sites 프로젝트에 보관합니다. 기존 브라우저 전용 인사는 자동 공개하지 않습니다.

창은 Esc 또는 ×로 닫을 수 있습니다. 최소화한 창은 작업표시줄에서 다시 열 수 있습니다.

## 파일 구성

- `_posts/`: Markdown 게시글
- `_layouts/`: 공통 화면과 글 본문 레이아웃
- `_config.yml`: Jekyll 설정
- `index.html`: 메인과 자동 생성되는 글 목록
- `style.css`, `app.js`: 디자인과 카테고리 필터
- `assets/room.png`, `assets/avatar.png`: 미니룸 배경과 픽셀 프로필
- `_includes/icons.html`: 인터랙티브 가구와 바탕화면 아이콘

GitHub Pages가 main 브랜치 루트에서 Jekyll로 빌드하고 배포합니다.

로컬 실행(Ruby/Bundler 설치 필요): `bundle install` 후 `bundle exec jekyll serve`.
`Validate Jekyll` 검증은 임시 Markdown 글로 목록·본문 생성을 확인합니다. 검증용 글은 실행 환경에서만 만들어지며 사이트에 배포되지 않습니다.

## 라이선스

이 저장소에는 별도의 라이선스를 지정하지 않았습니다. 코드, 디자인, 이미지 또는 글을 사용·수정·재배포하고 싶다면 [작성자 seoyc0219](https://github.com/seoyc0219)에게 먼저 연락해 주세요.

외부 라이브러리와 폰트 등 제3자 자료에는 각 자료의 라이선스가 적용됩니다.
