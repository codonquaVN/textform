// Khởi tạo extension
function initializeExtension() {
  console.log('Initializing extension');
  
  // Xóa menu cũ nếu có
  chrome.contextMenus.removeAll(() => {
    // Tạo menu mới
    chrome.contextMenus.create({
      id: "productSearch",
      title: "Tìm kiếm sản phẩm",
      contexts: ["all"],
      documentUrlPatterns: ["<all_urls>"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating context menu:', chrome.runtime.lastError);
      } else {
        console.log('Context menu created successfully');
      }
    });
  });
}

// Khởi tạo khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  initializeExtension();
});

// Khởi tạo khi Chrome khởi động
chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome started');
  initializeExtension();
});

// Xử lý khi click vào context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info);
  if (info.menuItemId === "productSearch") {
    console.log('Sending message to content script, tab:', tab.id);
    
    // Đảm bảo content script đã được inject
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        console.log('Content script check - running in page');
        return true;
      }
    }).then(() => {
      // Gửi message tới content script để mở popup tìm kiếm
      chrome.tabs.sendMessage(tab.id, {
        action: "openProductSearch",
        targetElement: info.targetElementId
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          // Thử inject content script nếu có lỗi
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).then(() => {
            // Thử gửi lại message sau khi inject
            chrome.tabs.sendMessage(tab.id, {
              action: "openProductSearch",
              targetElement: info.targetElementId
            });
          }).catch(err => {
            console.error('Error injecting content script:', err);
          });
        } else {
          console.log('Message sent successfully');
        }
      });
    }).catch(err => {
      console.error('Error checking content script:', err);
    });
  }
});

// Xử lý các message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "searchProducts") {
    console.log('Searching products:', request.searchTerm);
    // Gọi API tìm kiếm sản phẩm
    fetch(`http://localhost:3000/api/products/search?q=${encodeURIComponent(request.searchTerm)}`)
      .then(response => {
        console.log('API response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Products found:', data);
        sendResponse({products: data});
      })
      .catch(error => {
        console.error('Error searching products:', error);
        sendResponse({products: []});
      });
    return true;
  } else if (request.action === "checkStatus") {
    // Kiểm tra trạng thái extension
    sendResponse({
      status: "active",
      contextMenu: true,
      version: chrome.runtime.getManifest().version
    });
    return true;
  }
}); 