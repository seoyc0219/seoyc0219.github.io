# seoyc0219

https://seoyc0219.github.io/

포근한 구름 디자인의 Jekyll 블로그. 개발 · 보안 · 기타. 카테고리를 사용합니다.

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

## 파일 구성

- `_posts/`: Markdown 게시글
- `_layouts/`: 공통 화면과 글 본문 레이아웃
- `_config.yml`: Jekyll 설정
- `index.html`: 메인과 자동 생성되는 글 목록
- `style.css`, `app.js`: 디자인과 카테고리 필터
- `cloud-hero.png`: 구름 이미지

GitHub Pages가 main 브랜치 루트에서 Jekyll로 빌드하고 배포합니다.

로컬 실행(Ruby/Bundler 설치 필요): `bundle install` 후 `bundle exec jekyll serve`.
`Validate Jekyll` 검증은 임시 Markdown 글로 목록·본문 생성을 확인합니다. 검증용 글은 실행 환경에서만 만들어지며 사이트에 배포되지 않습니다.
