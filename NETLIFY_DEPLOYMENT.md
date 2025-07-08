# Netlify 배포 가이드

## 필요한 환경 변수 설정

Netlify 사이트 설정에서 다음 환경 변수를 설정하세요:

### 필수 환경 변수
- `ADMIN_PASSWORD`: 관리자 비밀번호 (기본값: admin123)
- `MONGODB_URI`: MongoDB Atlas 연결 문자열 (예: mongodb+srv://username:password@cluster.mongodb.net/geumbaeksa)

### 선택적 환경 변수 (이미지 업로드 기능 사용 시)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary 클라우드 이름
- `CLOUDINARY_API_KEY`: Cloudinary API 키
- `CLOUDINARY_API_SECRET`: Cloudinary API 시크릿

## 배포 단계

### 1. GitHub 저장소 연결
1. 코드를 GitHub 저장소에 push
2. Netlify에서 "New site from Git" 선택
3. GitHub 저장소 선택

### 2. 빌드 설정
- **Build command**: `npm run build`
- **Publish directory**: `public`
- **Functions directory**: `netlify/functions`

### 3. 환경 변수 설정
1. Netlify 사이트 설정 → Environment variables
2. 위에서 언급한 환경 변수들 추가

### 4. 배포
- 설정 완료 후 자동 배포 시작
- 배포 완료 후 사이트 URL 확인

## API 엔드포인트

배포 후 다음 API 엔드포인트들이 사용 가능합니다:

### 공개 API
- `GET /api/branches` - 모든 지점 조회
- `GET /api/branches/:id` - 특정 지점 조회
- `GET /api/slides` - 모든 슬라이드 조회
- `GET /api/contact` - 연락처 정보 조회
- `GET /api/reviews` - 모든 후기 조회
- `GET /api/reviews/random/:count` - 랜덤 후기 조회
- `GET /api/reviews/branch/:branchId` - 지점별 후기 조회
- `GET /api/images/:id` - 이미지 파일 조회

### 관리자 API (인증 필요)
- `POST /api/admin/login` - 관리자 로그인
- `GET /api/admin/status` - 관리자 상태 확인
- `POST /api/branches` - 지점 추가
- `PUT /api/branches/:id` - 지점 수정
- `DELETE /api/branches/:id` - 지점 삭제
- `POST /api/slides` - 슬라이드 추가
- `PUT /api/slides/:id` - 슬라이드 수정
- `DELETE /api/slides/:id` - 슬라이드 삭제
- `PUT /api/contact` - 연락처 정보 수정
- `POST /api/reviews` - 후기 추가
- `PUT /api/reviews/:id` - 후기 수정
- `DELETE /api/reviews/:id` - 후기 삭제

## 관리자 페이지 접근

- 메인 사이트: `https://your-site.netlify.app`
- 관리자 페이지: `https://your-site.netlify.app/admin`
- 관리자 로그인: 설정한 `ADMIN_PASSWORD` 사용

## 이미지 업로드

이미지 업로드 기능을 사용하려면:

1. [Cloudinary](https://cloudinary.com/) 계정 생성
2. Dashboard에서 Cloud name, API Key, API Secret 확인
3. Netlify 환경 변수에 추가
4. 이미지 업로드 시 Cloudinary에 자동 저장

## 문제 해결

### 함수 실행 오류
- Netlify Functions 로그 확인
- 환경 변수 설정 확인
- 의존성 설치 확인

### 데이터 초기화
- 첫 배포 시 기본 데이터 자동 생성
- 데이터 수정 후 JSON 파일에 저장

### CORS 오류
- 모든 함수에서 CORS 헤더 설정 완료
- 프론트엔드에서 별도 설정 불필요

## 백업 및 복구

데이터는 다음 위치에 저장됩니다:
- `data/branches.json` - 지점 정보
- `data/slides.json` - 슬라이드 정보  
- `data/contact.json` - 연락처 정보

정기적으로 이 파일들을 백업하는 것을 권장합니다. 