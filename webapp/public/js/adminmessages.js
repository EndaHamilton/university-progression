document.addEventListener('DOMContentLoaded', () => {
  const userId = document.getElementById('userId')?.dataset.userId || null;
  /*userId is rendered server-side and injected in ejs file -
  adding null here also just so app doesnt crash (but user id should always be set) */

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

  function validateCohortMessageFields({ sender_id, subject, body }) {
    const cleaned = {
      sender_id: parseInt(sender_id),
      subject: String(subject).trim(),
      body: String(body).trim()
    };

    if (isNaN(cleaned.sender_id) || cleaned.sender_id <= 0) return { error: "Invalid sender." };
    if (!cleaned.subject) return { error: "Subject is required." };
    if (cleaned.subject.length > 255) return { error: "Subject cannot exceed 255 characters." };
    if (!cleaned.body) return { error: "Message body is required." };

    return { cleaned };
  }

  // Success / error msg function
  function showMessage(div, message, isSuccess = true) {
    div.classList.remove('d-none', 'alert-success', 'alert-danger');
    div.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
    div.innerText = message;


    setTimeout(() => {
      div.classList.add('d-none');
      div.innerText = '';
    }, 5000);
  }

  // Shared send message function
  async function sendMessage(url, payload) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      return res.ok ? { success: true, data } : { success: false, error: data.error || 'Error sending message' };
    } catch (err) {
      return { success: false, error: 'Server error. Please try again.' };
    }
  }

  // Individual Message Form
  const individualForm = document.getElementById('individualMessageForm');
  individualForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const raw = {
      sender_id: userId,
      receiver_id: document.getElementById('receiver_id').value,
      subject: document.getElementById('individual_subject').value,
      body: document.getElementById('individual_body').value
    };

    const result = validateMessageFields(raw);

    const errorDiv = document.getElementById('individualMessageError');
    const successDiv = document.getElementById('individualMessageSuccess');

    if (result.error) {
      showMessage(errorDiv, result.error, false);
      return;
    }

    payload = result.cleaned;

    const res = await sendMessage('/adminmessages/send-individual', payload);
    if (res.success) {
      showMessage(successDiv, 'Message sent!');
      individualForm.reset();
    } else {
      showMessage(errorDiv, res.error, false);
    }
  });

  // Cohort Message Form
  const cohortForm = document.getElementById('cohortMessageForm');
  cohortForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    // const pathway = document.getElementById('pathway').value || null;
    // const level = document.getElementById('level').value || null;
    // const status = document.getElementById('study_status').value || null;
    // const subject = document.getElementById('cohort_subject').value.trim();
    // const body = document.getElementById('cohort_body').value.trim();

    const subject = document.getElementById('cohort_subject').value;
    const body = document.getElementById('cohort_body').value;
    const raw = { sender_id: userId, subject, body };

    const result = validateCohortMessageFields(raw);

    const errorDiv = document.getElementById('cohortMessageError');
    const successDiv = document.getElementById('cohortMessageSuccess');

    if (result.error) {
      showMessage(errorDiv, result.error, false);
      return;
    }

    const payload = {
      ...result.cleaned,
      target_pathway_id: parseInt(document.getElementById('pathway').value) || null,
      target_level_id: parseInt(document.getElementById('level').value) || null,
      target_study_status_id: parseInt(document.getElementById('study_status').value) || null
    };

    // const payload = {
    //   sender_id: userId,
    //   target_pathway_id: pathway,
    //   target_level_id: level,
    //   target_study_status_id: status,
    //   subject,
    //   body
    // };

    const res = await sendMessage('/adminmessages/send-cohort', payload);
    if (res.success) {
      showMessage(successDiv, 'Cohort message sent!');
      cohortForm.reset();
    } else {
      showMessage(errorDiv, res.error, false);
    }
  });

  // Load sent messages function
  async function loadSentMessages() {
    try {
      const res = await fetch('/adminmessages/sent');
      const data = await res.json();

      const tableBody = document.querySelector('#sentMessagesTable tbody');
      tableBody.innerHTML = '';

      if (!Array.isArray(data)) {
        tableBody.innerHTML = `<tr><td colspan="4">No messages found.</td></tr>`;
        return;
      }

      data.forEach(msg => {
        const recipient = msg.receiver_id
          ? `Student: ${msg.receiver_first_name} ${msg.receiver_last_name} (${msg.receiver_student_number})`
          : (msg.target_pathway_name || msg.target_level_name || msg.target_study_status_name
            ? `Cohort: ${[
              msg.target_pathway_name ? 'Pathway: ' + msg.target_pathway_name : '',
              msg.target_level_name ? 'Level: ' + msg.target_level_name : '',
              msg.target_study_status_name ? 'Status: ' + msg.target_study_status_name : ''
            ].filter(Boolean).join(', ')}`
            : 'All Students');

        const row = `
            <tr>
              <td>${msg.subject}</td>
              <td>${recipient}</td>
              <td>${msg.body}</td>
              <td>${new Date(msg.created_at).toLocaleString()}</td>
            </tr>
          `;
        tableBody.insertAdjacentHTML('beforeend', row);
      });

    } catch (err) {
      console.error("Error loading sent messages:", err);
    }
  }

  // Load received messages function
  async function loadReceivedMessages() {
    try {
      const res = await fetch('/adminmessages/admin-inbox');
      const data = await res.json();

      const tableBody = document.querySelector('#receivedMessagesTable tbody');
      tableBody.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4">No messages received.</td></tr>`;
        return;
      }

      data.forEach(msg => {
        const sender = msg.sender_first_name && msg.sender_last_name
          ? `${msg.sender_first_name} ${msg.sender_last_name} (${msg.sender_student_number})`
          : msg.sender_email || `User ID ${msg.sender_id}`;

        const row = `
        <tr>
          <td>${msg.subject}</td>
          <td>${sender}</td>
          <td>${msg.body}</td>
          <td>${new Date(msg.created_at).toLocaleString()}</td>
        </tr>
      `;
        tableBody.insertAdjacentHTML('beforeend', row);
      });

    } catch (err) {
      console.error("Error loading received messages:", err);
    }
  }

  // Load received messages on tab click1
  document.getElementById('received-tab')?.addEventListener('click', loadReceivedMessages);
  // Load sent messages on tab click
  document.getElementById('sent-tab')?.addEventListener('click', loadSentMessages);


});
