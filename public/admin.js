// 전역 변수
let branches = [];
let slides = [];
let contact = {};
let reviews = [];
let currentEditingBranch = null;
let currentEditingSlide = null;
let currentEditingReview = null;
let deleteTargetId = null;
let deleteSlideTargetId = null;
let deleteReviewTargetId = null;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadBranches();
    loadSlides();
    loadContact();
    loadReviews();
    initializeEventListeners();
    updateDashboard();
});

// 인증 상태 확인
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin-login.html';
            return;
        }
        
        const response = await fetch('/api/admin/status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (!data.isAdmin) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
            return;
        }
    } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login.html';
    }
}

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 폼 제출 이벤트
    document.getElementById('branchForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('slideForm').addEventListener('submit', handleSlideFormSubmit);
    document.getElementById('contactForm').addEventListener('submit', handleContactFormSubmit);
    document.getElementById('reviewForm').addEventListener('submit', handleReviewFormSubmit);
    
    // 이미지 파일 선택 이벤트
    document.getElementById('branchImage').addEventListener('change', handleImagePreview);
    document.getElementById('slideImage').addEventListener('change', handleSlideImagePreview);
    document.getElementById('reviewImage').addEventListener('change', handleReviewImagePreview);
    
    // 모달 외부 클릭 이벤트
    window.addEventListener('click', handleModalClick);
    
    // ESC 키 이벤트
    document.addEventListener('keydown', handleEscapeKey);
}

// 지점 데이터 로드
async function loadBranches() {
    try {
        showLoading();
        const response = await fetch('/api/branches');
        if (!response.ok) throw new Error('데이터를 불러올 수 없습니다.');
        
        branches = await response.json();
        displayBranches();
        updateDashboard();
    } catch (error) {
        console.error('지점 데이터 로드 중 오류:', error);
        showToast('지점 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 슬라이드 데이터 로드
async function loadSlides() {
    try {
        showLoading();
        const response = await fetch('/api/slides');
        if (!response.ok) throw new Error('슬라이드 데이터를 불러올 수 없습니다.');
        
        slides = await response.json();
        displaySlides();
    } catch (error) {
        console.error('슬라이드 데이터 로드 중 오류:', error);
        showToast('슬라이드 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 연락처 데이터 로드
async function loadContact() {
    try {
        const response = await fetch('/api/contact');
        if (!response.ok) throw new Error('연락처 데이터를 불러올 수 없습니다.');
        
        contact = await response.json();
        displayContact();
    } catch (error) {
        console.error('연락처 데이터 로드 중 오류:', error);
        showToast('연락처 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 후기 데이터 로드
async function loadReviews() {
    try {
        showLoading();
        const response = await fetch('/api/reviews');
        if (!response.ok) throw new Error('후기 데이터를 불러올 수 없습니다.');
        
        reviews = await response.json();
        displayReviews();
    } catch (error) {
        console.error('후기 데이터 로드 중 오류:', error);
        showToast('후기 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 연락처 정보 표시
function displayContact() {
    document.getElementById('displayPhoneNumber').textContent = contact.phone?.number || '1588-1234';
    document.getElementById('displayPhoneHours').textContent = contact.phone?.hours || '평일 9:00-18:00';
    document.getElementById('displayEmailAddress').textContent = contact.email?.address || 'info@geumbaeksa.com';
    document.getElementById('displayEmailHours').textContent = contact.email?.hours || '24시간 접수';
    document.getElementById('displayKakaoId').textContent = contact.kakao?.id || '@금박사';
    document.getElementById('displayKakaoHours').textContent = contact.kakao?.hours || '평일 9:00-18:00';
}

// 지점 목록 표시
function displayBranches() {
    const tableBody = document.getElementById('branchesTableBody');
    
    if (branches.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-store"></i>
                    <h3>등록된 지점이 없습니다</h3>
                    <p>새로운 지점을 추가해보세요.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = branches.map(branch => `
        <tr>
            <td>${branch.id}</td>
            <td><strong>${branch.name}</strong></td>
            <td>${branch.address}</td>
            <td>${branch.phone}</td>
            <td>${branch.hours}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editBranch(${branch.id})">
                        <i class="fas fa-edit"></i>
                        수정
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBranch(${branch.id})">
                        <i class="fas fa-trash"></i>
                        삭제
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 슬라이드 목록 표시
function displaySlides() {
    const tableBody = document.getElementById('slidesTableBody');
    
    if (slides.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-images"></i>
                    <h3>등록된 슬라이드가 없습니다</h3>
                    <p>새로운 슬라이드를 추가해보세요.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = slides.map(slide => `
        <tr>
            <td>${slide.id}</td>
            <td><strong>${slide.title}</strong></td>
            <td>${slide.description.length > 50 ? slide.description.substring(0, 50) + '...' : slide.description}</td>
            <td>
                <img src="${slide.image || '/uploads/default-slide.jpg'}?t=${Date.now()}" 
                     alt="${slide.title}" 
                     style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>
                <span class="status-badge ${slide.active ? 'active' : 'inactive'}">
                    ${slide.active ? '활성화' : '비활성화'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editSlide(${slide.id})">
                        <i class="fas fa-edit"></i>
                        수정
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSlide(${slide.id})">
                        <i class="fas fa-trash"></i>
                        삭제
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 후기 목록 표시
function displayReviews() {
    const tableBody = document.getElementById('reviewsTableBody');
    
    if (reviews.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>등록된 후기가 없습니다</h3>
                    <p>새로운 후기를 추가해보세요.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = reviews.map(review => `
        <tr>
            <td>${review.id}</td>
            <td><strong>${review.branchName}</strong></td>
            <td>${review.customerName}</td>
            <td>
                <div class="rating">
                    ${'⭐'.repeat(review.rating)}
                    <span class="rating-score">(${review.rating})</span>
                </div>
            </td>
            <td>
                <div class="comment-cell">
                    ${review.comment.length > 50 ? review.comment.substring(0, 50) + '...' : review.comment}
                </div>
            </td>
            <td>
                ${review.image ? `<img src="${review.image}?t=${Date.now()}" 
                     alt="후기 이미지" 
                     style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">` : '이미지 없음'}
            </td>
            <td>
                <span class="status-badge ${review.isActive ? 'active' : 'inactive'}">
                    ${review.isActive ? '활성화' : '비활성화'}
                </span>
            </td>
            <td>
                <div class="date-cell">
                    ${new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editReview(${review.id})">
                        <i class="fas fa-edit"></i>
                        수정
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReview(${review.id})">
                        <i class="fas fa-trash"></i>
                        삭제
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 대시보드 업데이트
function updateDashboard() {
    document.getElementById('totalBranches').textContent = branches.length;
    
    // 애니메이션 효과
    animateNumber('totalBranches', branches.length);
}

// 숫자 애니메이션
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

// 지점 추가 모달 열기
function openAddBranchModal() {
    currentEditingBranch = null;
    document.getElementById('formModalTitle').textContent = '지점 추가';
    document.getElementById('submitButtonText').textContent = '추가';
    resetForm();
    document.getElementById('branchFormModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 지점 수정 모달 열기
function editBranch(branchId) {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    
    currentEditingBranch = branch;
    document.getElementById('formModalTitle').textContent = '지점 수정';
    document.getElementById('submitButtonText').textContent = '수정';
    
    // 폼에 기존 데이터 채우기
    document.getElementById('branchName').value = branch.name;
    document.getElementById('branchPhone').value = branch.phone;
    document.getElementById('branchAddress').value = branch.address;
    document.getElementById('branchHours').value = branch.hours;
    document.getElementById('branchDescription').value = branch.description;
    document.getElementById('branchFeatures').value = branch.features.join(', ');
    
    // 이미지 미리보기
    if (branch.image) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${branch.image}" alt="지점 이미지">`;
        preview.classList.add('has-image');
    }
    
    document.getElementById('branchFormModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 지점 삭제
function deleteBranch(branchId) {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    
    deleteTargetId = branchId;
    document.getElementById('deleteBranchName').textContent = branch.name;
    document.getElementById('deleteModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 삭제 확인
async function confirmDelete() {
    if (!deleteTargetId) return;
    
    try {
        showLoading();
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/branches/${deleteTargetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('삭제 실패');
        
        await loadBranches();
        closeDeleteModal();
        showToast('지점이 성공적으로 삭제되었습니다.', 'success');
    } catch (error) {
        console.error('지점 삭제 중 오류:', error);
        showToast('지점 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 슬라이드 추가 모달 열기
function openAddSlideModal() {
    currentEditingSlide = null;
    document.getElementById('slideFormModalTitle').textContent = '슬라이드 추가';
    document.getElementById('slideSubmitButtonText').textContent = '추가';
    resetSlideForm();
    document.getElementById('slideFormModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 슬라이드 수정 모달 열기
function editSlide(slideId) {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    
    currentEditingSlide = slide;
    document.getElementById('slideFormModalTitle').textContent = '슬라이드 수정';
    document.getElementById('slideSubmitButtonText').textContent = '수정';
    
    // 폼에 기존 데이터 채우기
    document.getElementById('slideTitle').value = slide.title;
    document.getElementById('slideDescription').value = slide.description;
    document.getElementById('slideActive').value = slide.active.toString();
    
    // 이미지 미리보기
    if (slide.image) {
        const preview = document.getElementById('slideImagePreview');
        preview.innerHTML = `<img src="${slide.image}?t=${Date.now()}" alt="슬라이드 이미지">`;
        preview.classList.add('has-image');
    }
    
    document.getElementById('slideFormModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 슬라이드 삭제
function deleteSlide(slideId) {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    
    deleteSlideTargetId = slideId;
    document.getElementById('deleteSlideTitle').textContent = slide.title;
    document.getElementById('deleteSlideModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 슬라이드 삭제 확인
async function confirmDeleteSlide() {
    if (!deleteSlideTargetId) return;
    
    try {
        showLoading();
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/slides/${deleteSlideTargetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('삭제 실패');
        
        await loadSlides();
        closeDeleteSlideModal();
        showToast('슬라이드가 성공적으로 삭제되었습니다.', 'success');
    } catch (error) {
        console.error('슬라이드 삭제 중 오류:', error);
        showToast('슬라이드 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 슬라이드 폼 제출 처리
async function handleSlideFormSubmit(e) {
    e.preventDefault();
    
    if (!validateSlideForm()) return;
    
    try {
        showLoading();
        const formData = new FormData(e.target);
        
        const url = currentEditingSlide 
            ? `/api/slides/${currentEditingSlide.id}`
            : '/api/slides';
        
        const method = currentEditingSlide ? 'PUT' : 'POST';
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('슬라이드 저장 실패');
        
        await loadSlides();
        closeSlideFormModal();
        showToast(
            currentEditingSlide ? '슬라이드가 성공적으로 수정되었습니다.' : '슬라이드가 성공적으로 추가되었습니다.',
            'success'
        );
    } catch (error) {
        console.error('슬라이드 저장 중 오류:', error);
        showToast('슬라이드 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 슬라이드 폼 검증
function validateSlideForm() {
    clearAllSlideFieldErrors();
    
    const title = document.getElementById('slideTitle');
    const description = document.getElementById('slideDescription');
    
    let isValid = true;
    
    if (!title.value.trim()) {
        showSlideFieldError(title, '제목을 입력해주세요.');
        isValid = false;
    }
    
    if (!description.value.trim()) {
        showSlideFieldError(description, '설명을 입력해주세요.');
        isValid = false;
    }
    
    return isValid;
}

// 슬라이드 필드 오류 표시
function showSlideFieldError(element, message) {
    element.classList.add('error');
    
    let errorElement = element.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        element.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

// 모든 슬라이드 필드 오류 제거
function clearAllSlideFieldErrors() {
    const errorElements = document.querySelectorAll('#slideForm .error-message');
    errorElements.forEach(el => el.remove());
    
    const errorFields = document.querySelectorAll('#slideForm .error');
    errorFields.forEach(el => el.classList.remove('error'));
}

// 슬라이드 이미지 미리보기
function handleSlideImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('slideImagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="슬라이드 미리보기">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
        preview.classList.remove('has-image');
    }
}

// 슬라이드 폼 리셋
function resetSlideForm() {
    document.getElementById('slideForm').reset();
    document.getElementById('slideImagePreview').innerHTML = '';
    document.getElementById('slideImagePreview').classList.remove('has-image');
    clearAllSlideFieldErrors();
}

// 슬라이드 모달 닫기
function closeSlideFormModal() {
    document.getElementById('slideFormModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentEditingSlide = null;
    resetSlideForm();
}

function closeDeleteSlideModal() {
    document.getElementById('deleteSlideModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    deleteSlideTargetId = null;
}

// 폼 제출 처리
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
        showLoading();
        const formData = new FormData(e.target);
        
        const url = currentEditingBranch 
            ? `/api/branches/${currentEditingBranch.id}`
            : '/api/branches';
        
        const method = currentEditingBranch ? 'PUT' : 'POST';
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('저장 실패');
        
        await loadBranches();
        closeBranchFormModal();
        
        const message = currentEditingBranch 
            ? '지점이 성공적으로 수정되었습니다.'
            : '지점이 성공적으로 추가되었습니다.';
        
        showToast(message, 'success');
        
    } catch (error) {
        console.error('폼 제출 중 오류:', error);
        showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 폼 유효성 검사
function validateForm() {
    const requiredFields = [
        { id: 'branchName', name: '지점명' },
        { id: 'branchPhone', name: '전화번호' },
        { id: 'branchAddress', name: '주소' },
        { id: 'branchHours', name: '영업시간' },
        { id: 'branchDescription', name: '지점 설명' }
    ];
    
    let isValid = true;
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const value = element.value.trim();
        
        if (!value) {
            showFieldError(element, `${field.name}을(를) 입력해주세요.`);
            isValid = false;
        } else {
            clearFieldError(element);
        }
    });
    
    // 전화번호 형식 검증
    const phoneInput = document.getElementById('branchPhone');
    const phonePattern = /^[0-9-]+$/;
    if (phoneInput.value && !phonePattern.test(phoneInput.value)) {
        showFieldError(phoneInput, '올바른 전화번호 형식을 입력해주세요.');
        isValid = false;
    }
    
    return isValid;
}

// 필드 오류 표시
function showFieldError(element, message) {
    element.classList.add('invalid');
    
    // 기존 오류 메시지 제거
    const existingError = element.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // 새 오류 메시지 추가
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    element.parentNode.appendChild(errorDiv);
}

// 필드 오류 제거
function clearFieldError(element) {
    element.classList.remove('invalid');
    const errorMessage = element.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// 이미지 미리보기 처리
function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="미리보기">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<span class="empty">이미지를 선택해주세요</span>';
        preview.classList.remove('has-image');
    }
}

// 폼 리셋
function resetForm() {
    document.getElementById('branchForm').reset();
    clearAllFieldErrors();
    
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '<span class="empty">이미지를 선택해주세요</span>';
    preview.classList.remove('has-image');
}

// 모든 필드 오류 제거
function clearAllFieldErrors() {
    const invalidFields = document.querySelectorAll('.invalid');
    invalidFields.forEach(field => clearFieldError(field));
}

// 모달 닫기 함수들
function closeBranchFormModal() {
    document.getElementById('branchFormModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentEditingBranch = null;
    resetForm();
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    deleteTargetId = null;
}

// 모달 외부 클릭 처리
function handleModalClick(e) {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'branchFormModal') {
            closeBranchFormModal();
        } else if (e.target.id === 'deleteModal') {
            closeDeleteModal();
        }
    }
}

// ESC 키 처리
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                if (modal.id === 'branchFormModal') {
                    closeBranchFormModal();
                } else if (modal.id === 'deleteModal') {
                    closeDeleteModal();
                }
            }
        });
    }
}

// 로딩 표시/숨기기
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

// 토스트 알림 표시
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 토스트 아이콘 가져오기
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}

// 로그아웃
async function logout() {
    if (confirm('정말 로그아웃하시겠습니까?')) {
        try {
            // localStorage에서 토큰 제거
            localStorage.removeItem('adminToken');
            
            showToast('로그아웃되었습니다.', 'info');
            setTimeout(() => {
                window.location.href = '/admin-login.html';
            }, 1000);
        } catch (error) {
            console.error('로그아웃 오류:', error);
            showToast('로그아웃 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 데이터 새로고침
function refreshData() {
    loadBranches();
    showToast('데이터가 새로고침되었습니다.', 'info');
}

// 통계 업데이트 (시뮬레이션)
function updateStats() {
    const visitors = Math.floor(Math.random() * 1000) + 1000;
    const inquiries = Math.floor(Math.random() * 100) + 50;
    
    document.getElementById('totalVisitors').textContent = visitors.toLocaleString();
    document.getElementById('totalInquiries').textContent = inquiries;
}

// 데이터 내보내기 (시뮬레이션)
function exportData() {
    const data = {
        branches: branches,
        exportDate: new Date().toISOString(),
        totalCount: branches.length
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `geumbaeksa-branches-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('데이터가 내보내졌습니다.', 'success');
}

// 이미지 업로드 드래그 앤 드롭
function initializeDragAndDrop() {
    const imageInput = document.getElementById('branchImage');
    const preview = document.getElementById('imagePreview');
    
    preview.addEventListener('dragover', function(e) {
        e.preventDefault();
        preview.style.borderColor = '#667eea';
        preview.style.background = '#f8f9ff';
    });
    
    preview.addEventListener('dragleave', function(e) {
        e.preventDefault();
        preview.style.borderColor = '#ecf0f1';
        preview.style.background = 'transparent';
    });
    
    preview.addEventListener('drop', function(e) {
        e.preventDefault();
        preview.style.borderColor = '#ecf0f1';
        preview.style.background = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            imageInput.files = files;
            handleImagePreview({ target: imageInput });
        }
    });
}

// 페이지 로드 시 드래그 앤 드롭 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeDragAndDrop();
});

// 검색 기능
function initializeSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '지점명 또는 주소로 검색...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
        padding: 10px 15px;
        border: 2px solid #ecf0f1;
        border-radius: 8px;
        font-size: 1rem;
        width: 300px;
        margin-bottom: 20px;
    `;
    
    const sectionHeader = document.querySelector('.section-header');
    sectionHeader.insertBefore(searchInput, sectionHeader.querySelector('.btn'));
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBranches = branches.filter(branch => 
            branch.name.toLowerCase().includes(searchTerm) ||
            branch.address.toLowerCase().includes(searchTerm)
        );
        
        const originalBranches = branches;
        branches = filteredBranches;
        displayBranches();
        branches = originalBranches;
    });
}

// 검색 기능 초기화
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeSearch, 500); // 다른 초기화 후 실행
});

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // Ctrl + N: 새 지점 추가
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openAddBranchModal();
    }
    
    // Ctrl + R: 데이터 새로고침
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }
});

// 오프라인 상태 감지
window.addEventListener('online', function() {
    showToast('인터넷에 연결되었습니다.', 'success');
});

window.addEventListener('offline', function() {
    showToast('인터넷 연결이 끊어졌습니다.', 'error');
});

// 페이지 가시성 변경 감지
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 페이지가 다시 보이면 데이터 새로고침
        setTimeout(refreshData, 1000);
    }
});

// 성능 모니터링
function logPerformance() {
    if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`페이지 로드 시간: ${loadTime}ms`);
    }
}

// 페이지 로드 완료 시 성능 측정
window.addEventListener('load', function() {
    setTimeout(logPerformance, 0);
});

// 브라우저 호환성 체크
function checkBrowserSupport() {
    const features = {
        'Fetch API': typeof fetch !== 'undefined',
        'FormData': typeof FormData !== 'undefined',
        'FileReader': typeof FileReader !== 'undefined',
        'Blob': typeof Blob !== 'undefined'
    };
    
    const unsupported = Object.keys(features).filter(key => !features[key]);
    
    if (unsupported.length > 0) {
        console.warn('지원되지 않는 기능:', unsupported);
        showToast('브라우저 호환성 문제가 감지되었습니다.', 'error');
    }
}

// 초기화 시 브라우저 호환성 체크
document.addEventListener('DOMContentLoaded', function() {
    checkBrowserSupport();
});

// 연락처 관련 함수들

// 연락처 모달 열기
function openContactModal() {
    // 현재 연락처 정보로 폼 채우기
    document.getElementById('phoneNumber').value = contact.phone?.number || '';
    document.getElementById('phoneHours').value = contact.phone?.hours || '';
    document.getElementById('emailAddress').value = contact.email?.address || '';
    document.getElementById('emailHours').value = contact.email?.hours || '';
    document.getElementById('kakaoId').value = contact.kakao?.id || '';
    document.getElementById('kakaoHours').value = contact.kakao?.hours || '';
    
    document.getElementById('contactModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 연락처 모달 닫기
function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 연락처 폼 제출 처리
async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = Object.fromEntries(formData);
    
    try {
        showLoading();
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/contact', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contactData)
        });
        
        if (!response.ok) {
            throw new Error('연락처 정보를 저장할 수 없습니다.');
        }
        
        const updatedContact = await response.json();
        contact = updatedContact;
        
        displayContact();
        closeContactModal();
        showToast('연락처 정보가 성공적으로 업데이트되었습니다.', 'success');
        
    } catch (error) {
        console.error('연락처 저장 중 오류:', error);
        showToast('연락처 정보 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 후기 관리 관련 함수들

// 후기 추가 모달 열기
function openAddReviewModal() {
    resetReviewForm();
    populateBranchSelect();
    document.getElementById('reviewFormModalTitle').textContent = '후기 추가';
    document.getElementById('reviewSubmitButtonText').textContent = '추가';
    document.getElementById('reviewFormModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    currentEditingReview = null;
}

// 후기 수정 모달 열기
function editReview(reviewId) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    
    populateBranchSelect();
    
    // 폼 채우기
    document.getElementById('reviewBranch').value = review.branchId;
    document.getElementById('reviewCustomerName').value = review.customerName;
    document.getElementById('reviewRating').value = review.rating;
    document.getElementById('reviewComment').value = review.comment;
    document.getElementById('reviewActive').value = review.isActive.toString();
    
    // 기존 이미지 표시
    const imagePreview = document.getElementById('reviewImagePreview');
    if (review.image) {
        imagePreview.innerHTML = `
            <div class="current-image">
                <img src="${review.image}?t=${Date.now()}" alt="현재 이미지">
                <p>현재 이미지</p>
            </div>
        `;
    } else {
        imagePreview.innerHTML = '';
    }
    
    document.getElementById('reviewFormModalTitle').textContent = '후기 수정';
    document.getElementById('reviewSubmitButtonText').textContent = '수정';
    document.getElementById('reviewFormModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    currentEditingReview = review;
}

// 후기 삭제
function deleteReview(reviewId) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    
    document.getElementById('deleteReviewTitle').textContent = `${review.customerName}님의 후기`;
    document.getElementById('deleteReviewModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    deleteReviewTargetId = reviewId;
}

// 후기 삭제 확인
async function confirmDeleteReview() {
    if (!deleteReviewTargetId) return;
    
    try {
        showLoading();
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/reviews/${deleteReviewTargetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('후기를 삭제할 수 없습니다.');
        }
        
        await loadReviews();
        closeDeleteReviewModal();
        showToast('후기가 성공적으로 삭제되었습니다.', 'success');
        
    } catch (error) {
        console.error('후기 삭제 중 오류:', error);
        showToast('후기 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 후기 폼 제출 처리
async function handleReviewFormSubmit(e) {
    e.preventDefault();
    
    if (!validateReviewForm()) return;
    
    const formData = new FormData(e.target);
    
    // 지점 이름 추가
    const branchId = parseInt(formData.get('branchId'));
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
        formData.append('branchName', branch.name);
    }
    
    try {
        showLoading();
        
        const token = localStorage.getItem('adminToken');
        const url = currentEditingReview ? `/api/reviews/${currentEditingReview.id}` : '/api/reviews';
        const method = currentEditingReview ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('후기를 저장할 수 없습니다.');
        }
        
        await loadReviews();
        closeReviewFormModal();
        showToast(`후기가 성공적으로 ${currentEditingReview ? '수정' : '추가'}되었습니다.`, 'success');
        
    } catch (error) {
        console.error('후기 저장 중 오류:', error);
        showToast('후기 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 후기 폼 유효성 검사
function validateReviewForm() {
    clearAllReviewFieldErrors();
    let isValid = true;
    
    const branchId = document.getElementById('reviewBranch').value;
    const customerName = document.getElementById('reviewCustomerName').value.trim();
    const rating = document.getElementById('reviewRating').value;
    const comment = document.getElementById('reviewComment').value.trim();
    
    if (!branchId) {
        showReviewFieldError(document.getElementById('reviewBranch'), '지점을 선택해주세요.');
        isValid = false;
    }
    
    if (!customerName) {
        showReviewFieldError(document.getElementById('reviewCustomerName'), '고객명을 입력해주세요.');
        isValid = false;
    }
    
    if (!rating) {
        showReviewFieldError(document.getElementById('reviewRating'), '평점을 선택해주세요.');
        isValid = false;
    }
    
    if (!comment) {
        showReviewFieldError(document.getElementById('reviewComment'), '후기 내용을 입력해주세요.');
        isValid = false;
    }
    
    return isValid;
}

// 후기 폼 필드 오류 표시
function showReviewFieldError(element, message) {
    element.classList.add('error');
    
    let errorElement = element.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        element.parentNode.insertBefore(errorElement, element.nextSibling);
    }
    
    errorElement.textContent = message;
    errorElement.style.color = '#e74c3c';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '0.25rem';
}

// 후기 폼 모든 필드 오류 제거
function clearAllReviewFieldErrors() {
    document.querySelectorAll('#reviewForm .error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#reviewForm .error-message').forEach(el => el.remove());
}

// 후기 이미지 미리보기
function handleReviewImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('reviewImagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="미리보기" style="max-width: 200px; max-height: 200px; object-fit: cover;">
                    <p>새 이미지</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// 지점 선택 드롭다운 채우기
function populateBranchSelect() {
    const select = document.getElementById('reviewBranch');
    select.innerHTML = '<option value="">지점을 선택하세요</option>';
    
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.id;
        option.textContent = branch.name;
        select.appendChild(option);
    });
}

// 후기 폼 초기화
function resetReviewForm() {
    document.getElementById('reviewForm').reset();
    document.getElementById('reviewImagePreview').innerHTML = '';
    clearAllReviewFieldErrors();
}

// 후기 폼 모달 닫기
function closeReviewFormModal() {
    document.getElementById('reviewFormModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentEditingReview = null;
}

// 후기 삭제 모달 닫기
function closeDeleteReviewModal() {
    document.getElementById('deleteReviewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    deleteReviewTargetId = null;
} 