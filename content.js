let activeElement = null;
let targetElement = null;

// Thêm style cho highlight element
const style = document.createElement('style');
style.textContent = `
  .product-search-popup {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    padding: 10px;
    z-index: 10000;
    max-width: 300px;
  }
  .product-search-input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  .product-list {
    max-height: 200px;
    overflow-y: auto;
  }
  .product-item {
    padding: 8px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
  }
  .product-item:hover {
    background: #f5f5f5;
  }
  .highlight-target {
    outline: 2px solid #4CAF50 !important;
    outline-offset: -2px;
    cursor: pointer !important;
  }
  .target-instructions {
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 10001;
    font-family: Arial, sans-serif;
  }
`;
document.head.appendChild(style);

// Hàm để điền giá trị vào input
function setInputValue(element, value) {
  console.log('Setting value for element:', element);
  
  try {
    // Thử các phương thức khác nhau để điền giá trị
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    
    // Phương thức 1: Sử dụng value
    if (element.value !== undefined) {
      element.value = value;
    }
    
    // Phương thức 2: Sử dụng setAttribute
    element.setAttribute('value', value);
    
    // Phương thức 3: Sử dụng dispatchEvent
    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);
    
    // Phương thức 4: Sử dụng focus và blur
    element.focus();
    element.blur();
    
    // Phương thức 5: Sử dụng execCommand (cho các trình soạn thảo)
    if (element.contentEditable === 'true') {
      document.execCommand('insertText', false, value);
    }

    // Phương thức 6: Sử dụng textContent hoặc innerText
    if (element.tagName.toLowerCase() !== 'input') {
      element.textContent = value;
      element.innerText = value;
    }
    
    console.log('Value set successfully');
  } catch (error) {
    console.error('Error setting value:', error);
  }
}

// Hàm để bắt đầu chọn trường nhập liệu
function startTargetSelection() {
  const instructions = document.createElement('div');
  instructions.className = 'target-instructions';
  instructions.textContent = 'Click vào trường bạn muốn điền dữ liệu';
  document.body.appendChild(instructions);

  let currentHighlight = null;

  function handleMouseOver(e) {
    if (currentHighlight) {
      currentHighlight.classList.remove('highlight-target');
    }
    currentHighlight = e.target;
    e.target.classList.add('highlight-target');
  }

  function handleMouseOut(e) {
    e.target.classList.remove('highlight-target');
  }

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    targetElement = e.target;
    console.log('Selected target element:', targetElement);
    
    // Cleanup
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleClick);
    instructions.remove();
    
    if (currentHighlight) {
      currentHighlight.classList.remove('highlight-target');
    }
    
    // Show search popup
    const rect = targetElement.getBoundingClientRect();
    createSearchPopup(
      rect.left + window.scrollX,
      rect.bottom + window.scrollY
    );
  }

  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
}

// Tạo popup tìm kiếm
function createSearchPopup(x, y) {
  console.log('Creating search popup at:', x, y);
  const popup = document.createElement('div');
  popup.className = 'product-search-popup';
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;

  const input = document.createElement('input');
  input.className = 'product-search-input';
  input.placeholder = 'Nhập mã hoặc tên sản phẩm...';
  
  const productList = document.createElement('div');
  productList.className = 'product-list';

  popup.appendChild(input);
  popup.appendChild(productList);
  document.body.appendChild(popup);

  // Xử lý tìm kiếm khi nhập
  let debounceTimeout;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const searchTerm = input.value;
      console.log('Search term:', searchTerm);
      if (searchTerm.length > 0) {
        chrome.runtime.sendMessage(
          { action: "searchProducts", searchTerm },
          response => {
            console.log('Search response:', response);
            if (chrome.runtime.lastError) {
              console.error('Error in search:', chrome.runtime.lastError);
              return;
            }
            productList.innerHTML = '';
            if (response && response.products) {
              response.products.forEach(product => {
                const item = document.createElement('div');
                item.className = 'product-item';
                item.textContent = `${product.code} - ${product.name}`;
                item.addEventListener('click', () => {
                  console.log('Product selected:', product);
                  if (targetElement) {
                    setInputValue(targetElement, product.code);
                  } else {
                    console.error('No target element found');
                  }
                  popup.remove();
                });
                productList.appendChild(item);
              });
            } else {
              console.log('No products found');
              productList.innerHTML = '<div class="product-item">Không tìm thấy sản phẩm</div>';
            }
          }
        );
      } else {
        productList.innerHTML = '';
      }
    }, 300);
  });

  // Đóng popup khi click ra ngoài
  document.addEventListener('click', function closePopup(e) {
    if (!popup.contains(e.target) && e.target !== targetElement) {
      console.log('Closing popup');
      popup.remove();
      document.removeEventListener('click', closePopup);
    }
  });

  input.focus();
}

// Lắng nghe message từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  if (request.action === "openProductSearch") {
    startTargetSelection();
  }
}); 