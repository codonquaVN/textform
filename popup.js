document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
    // Kiểm tra trạng thái extension
    chrome.runtime.sendMessage({ action: "checkStatus" }, function(response) {
        console.log('Extension status:', response);
    });

    const fileInput = document.getElementById('file-input');
    const snippetsContainer = document.getElementById('snippets-container');
    
    // Load snippets from storage when popup opens
    chrome.storage.local.get(['snippets'], function(result) {
        if (result.snippets) {
            displaySnippets(result.snippets);
        }
    });

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                const snippets = text.split('\n').filter(snippet => snippet.trim() !== '');
                chrome.storage.local.set({ snippets: snippets }, function() {
                    displaySnippets(snippets);
                });
            };
            reader.readAsText(file);
        }
    });

    function displaySnippets(snippets) {
        snippetsContainer.innerHTML = '';
        snippets.forEach(snippet => {
            const snippetElement = document.createElement('div');
            snippetElement.className = 'snippet-item';
            snippetElement.textContent = snippet;
            snippetElement.addEventListener('click', function() {
                navigator.clipboard.writeText(snippet).then(() => {
                    snippetElement.style.backgroundColor = '#e6ffe6';
                    setTimeout(() => {
                        snippetElement.style.backgroundColor = '';
                    }, 500);
                });
            });
            snippetsContainer.appendChild(snippetElement);
        });
    }
}); 