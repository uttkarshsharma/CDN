
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the new searchbox HTML elements
    const searchboxToggleBtn = document.getElementById('searchbox-toggle-btn');
    const floatingSearchboxContainer = document.getElementById('floating-searchbox-container');
    const searchboxCloseBtn = document.getElementById('searchbox-close-btn');
    const searchboxInput = document.getElementById('searchbox-input');
    const searchboxSendBtn = document.getElementById('searchbox-send-btn');
    const searchResultsDiv = document.getElementById('search-results');

    /**
     * Appends a search result message to the search results display area.
     * @param {string} htmlContent The HTML string to append as a message.
     */
    function appendSearchResult(htmlContent) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('d-flex', 'mb-2', 'search-result-item'); // Add 'search-result-item' class
        // Apply Bootstrap and custom classes for styling consistent with the chatbot's bot messages
        messageDiv.innerHTML = `<div class="p-2 bg-light text-dark rounded-pill me-auto bot-message" style="max-width: 100%; border-bottom-left-radius: 0;">${htmlContent}</div>`;
        searchResultsDiv.appendChild(messageDiv);

        // Trigger the animation by adding the 'show' class after a slight delay
        // This ensures the browser has rendered the element before the transition starts.
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10);

        searchResultsDiv.scrollTop = searchResultsDiv.scrollHeight; // Auto-scroll to the bottom
    }

    /**
     * Determines the appropriate Bootstrap badge class based on severity.
     * This function is duplicated from index.html to ensure searchbox.js can be self-contained
     * if loaded independently, though it relies on the same logic.
     * @param {string} severity The severity level (e.g., 'Critical', 'High', 'Medium', 'Low').
     * @returns {string} The Bootstrap badge class string.
     */
    function getSeverityBadge(severity) {
        switch(severity.toLowerCase()) {
            case 'critical': return 'bg-danger';
            case 'high': return 'bg-warning text-dark';
            case 'medium': return 'bg-info text-dark';
            case 'low': return 'bg-secondary';
            default: return 'bg-light text-dark';
        }
    }

    /**
     * Performs a search across the global 'db' object for matching issues.
     * Results are displayed in the search results div.
     * @param {string} query The search term entered by the user.
     */
    function searchKnowledgeBase(query) {
        searchResultsDiv.innerHTML = ''; // Clear previous results before displaying new ones
        query = query.toLowerCase().trim();

        // Provide a hint if the query is too short
        if (query.length < 2) {
            appendSearchResult('Please type at least 2 characters to search.');
            return;
        }

        let foundResults = [];

        // Iterate through all categories (except 'dashboard') and their issues
        // The 'db' object is assumed to be globally available from index.html
        for (const categoryKey in db) {
            if (categoryKey !== 'dashboard' && db[categoryKey].issues) {
                const issues = db[categoryKey].issues;
                issues.forEach((issue, index) => {
                    const titleLower = issue.title.toLowerCase();
                    const contentLower = issue.content.toLowerCase();
                    const errorCodeLower = (issue.errorCode || '').toLowerCase();

                    // Check if the query matches the title, content, or error code
                    if (titleLower.includes(query) || contentLower.includes(query) || errorCodeLower.includes(query)) {
                        foundResults.push({ categoryKey, issue, issueIndex: index });
                    }
                });
            }
        }

        // Display search results or a "no results" message
        if (foundResults.length > 0) {
            appendSearchResult(`Found ${foundResults.length} result(s) for "${query}":`);
            foundResults.forEach(item => {
                const badgeColor = getSeverityBadge(item.issue.severity);
                // Construct the HTML for each search result, including a "View Details" button
                const resultHtml = `
                    <div class="mb-1 fw-bold">${item.issue.title}</div>
                    <span class="badge ${badgeColor} me-2">Severity: ${item.issue.severity}</span>
                    <span class="badge bg-dark">Error Code: ${item.issue.errorCode || 'N/A'}</span>
                    <p class="mt-2 text-muted small">${item.issue.content.substring(0, 100)}...</p>
                    <button class="btn btn-sm btn-link p-0 view-issue-btn" data-category="${item.categoryKey}" data-issue-index="${item.issueIndex}">View Details</button>
                `;
                appendSearchResult(resultHtml);
            });

            // Add event listeners to the dynamically created "View Details" buttons
            searchResultsDiv.querySelectorAll('.view-issue-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const categoryKey = e.currentTarget.dataset.category;
                    const issueIndex = parseInt(e.currentTarget.dataset.issueIndex, 10);
                    // Call the 'loadContent' function from index.html to navigate to the issue
                    // Assuming loadContent is globally available.
                    if (typeof loadContent === 'function') {
                        loadContent(categoryKey, { openIssueIndex: issueIndex });
                        floatingSearchboxContainer.style.display = 'none'; // Close searchbox after navigation
                    } else {
                        console.error('loadContent function not found. Ensure index.html script is loaded before searchbox.js.');
                    }
                });
            });

        } else {
            appendSearchResult(`No results found for "${query}". Try a different keyword.`);
        }
    }

    // Event Listener for the Searchbox Toggle Button
    searchboxToggleBtn.addEventListener('click', () => {
        // Toggle the display of the floating searchbox container
        floatingSearchboxContainer.style.display = floatingSearchboxContainer.style.display === 'none' ? 'flex' : 'none';
        if (floatingSearchboxContainer.style.display === 'flex') {
            searchboxInput.focus(); // Focus the input field when the searchbox opens
            searchResultsDiv.scrollTop = searchResultsDiv.scrollHeight; // Scroll to bottom
            // Display initial prompt if no search has been performed yet
            if (searchResultsDiv.children.length === 0 || searchResultsDiv.children[0].textContent.includes('Type to search')) {
                 appendSearchResult('Type to search for issues or error codes.');
            }
        }
    });

    // Event Listener for the Searchbox Close Button
    searchboxCloseBtn.addEventListener('click', () => {
        floatingSearchboxContainer.style.display = 'none';
    });

    // Event Listener for the Searchbox Send Button (manual trigger)
    searchboxSendBtn.addEventListener('click', () => {
        const query = searchboxInput.value.trim();
        if (query) {
            searchKnowledgeBase(query);
        }
    });

    // Event Listener for 'Enter' key press in the search input
    searchboxInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchboxSendBtn.click(); // Trigger search when Enter is pressed
        }
    });

    // Event Listener for live search as the user types (on 'input' event)
    searchboxInput.addEventListener('input', () => {
        const query = searchboxInput.value.trim();
        if (query.length >= 2) { // Perform live search only if at least 2 characters are typed
            searchKnowledgeBase(query);
        } else if (query.length === 0) {
            // Clear results and show initial prompt if input is empty
            searchResultsDiv.innerHTML = '';
            appendSearchResult('Type to search for issues or error codes.');
        }
    });
});
