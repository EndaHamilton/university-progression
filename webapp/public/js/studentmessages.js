document.addEventListener('DOMContentLoaded', () => {
    const userId = document.getElementById('userId')?.dataset.userId || null;

    const inboxTable = document.querySelector('#inboxMessagesTable tbody');
    const sentTable = document.querySelector('#sentMessagesTable tbody');
    const contactForm = document.getElementById('advisorMessageForm');

    const contactSuccess = document.getElementById('contactSuccess');
    const contactError = document.getElementById('contactError');

    // Helper show message function
    function showMessage(div, message, isSuccess = true) {
        div.classList.remove('d-none', 'alert-success', 'alert-danger');
        div.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
        div.innerText = message;

        setTimeout(() => {
            div.classList.add('d-none');
            div.innerText = '';
        }, 5000);
    }

    // Validation functions
    function validateMessageFields({ sender_id, receiver_id, subject, body }) {
        const cleaned = {
            sender_id: parseInt(sender_id),
            receiver_id: parseInt(receiver_id),
            subject: String(subject).trim(),
            body: String(body).trim()
        };

        if (isNaN(cleaned.sender_id) || cleaned.sender_id <= 0) return { error: "Invalid sender." };
        if (isNaN(cleaned.receiver_id) || cleaned.receiver_id <= 0) return { error: "Please select a valid recipient." };
        if (!cleaned.subject) return { error: "Subject is required." };
        if (cleaned.subject.length > 255) return { error: "Subject cannot exceed 255 characters." };
        if (!cleaned.body) return { error: "Message body is required." };

        return { cleaned };
    }

    // Load Inbox
    async function loadInbox() {
        try {
            const res = await fetch('/studentmessages/inbox');
            const data = await res.json();

            inboxTable.innerHTML = '';

            if (!Array.isArray(data) || data.length === 0) {
                inboxTable.innerHTML = '<tr><td colspan="4">No messages received.</td></tr>';
                return;
            }

            data.forEach(msg => {
                const isDirect = msg.receiver_id ? 'Direct' : 'Cohort';
                const row = `
            <tr>
              <td>${msg.subject}</td>
              <td>${msg.body}</td>
              <td>${new Date(msg.created_at).toLocaleString()}</td>
              <td>${isDirect}</td>
            </tr>
          `;
                inboxTable.insertAdjacentHTML('beforeend', row);
            });
        } catch (err) {
            console.error('Failed to load inbox:', err);
        }
    }

    // Send Message to Advisor
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('subject').value.trim();
        const body = document.getElementById('body').value.trim();

        contactSuccess.classList.add('d-none');
        contactError.classList.add('d-none');

        if (!subject || subject.length > 255) {
            return showMessage(contactError, 'Subject is required and must be under 255 characters.', false);
        }

        if (!body) {
            return showMessage(contactError, 'Message body is required.', false);
        }

        try {
            const res = await fetch('/studentmessages/contact-advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_id: userId, subject, body })
            });

            const data = await res.json();

            if (res.ok) {
                showMessage(contactSuccess, 'Message sent to your advisor!');
                contactForm.reset();
            } else {
                showMessage(contactError, data.error || 'Failed to send message.', false);
            }
        } catch (err) {
            showMessage(contactError, 'Server error. Please try again.', false);
        }
    });

    // Load Sent Messages 
    async function loadSentMessages() {
        try {
            const res = await fetch('/studentmessages/sent-from-student');
            const data = await res.json();

            sentTable.innerHTML = '';

            if (!Array.isArray(data) || data.length === 0) {
                sentTable.innerHTML = '<tr><td colspan="4">No sent messages found.</td></tr>';
                return;
            }

            data.forEach(msg => {
                const recipient = msg.receiver_username || msg.receiver_email || 'Advisor';
                const row = `
            <tr>
              <td>${msg.subject}</td>
              <td>${recipient}</td>
              <td>${msg.body}</td>
              <td>${new Date(msg.created_at).toLocaleString()}</td>
            </tr>
          `;
                sentTable.insertAdjacentHTML('beforeend', row);
            });
        } catch (err) {
            console.error('Failed to load sent messages:', err);
        }
    }

    //Tab Event Listeners
    document.getElementById('inbox-tab')?.addEventListener('click', loadInbox);
    document.getElementById('sent-tab')?.addEventListener('click', loadSentMessages);

    // Load inbox by default when rendering the page
    loadInbox();
});
