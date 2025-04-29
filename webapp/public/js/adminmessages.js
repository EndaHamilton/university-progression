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
    if (result.error) return alert(result.error);
    payload = result.cleaned;

    const res = await sendMessage('/adminmessages/send-individual', payload);
    if (res.success) {
      alert('Message sent!');
      individualForm.reset();
    } else {
      alert(res.error);
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
    if (result.error) return alert(result.error);

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
      alert('Cohort message sent!');
      cohortForm.reset();
    } else {
      alert(res.error);
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
          : `Cohort: ${[
            msg.target_pathway_id ? 'Pathway ' + msg.target_pathway_id : '',
            msg.target_level_id ? 'Level ' + msg.target_level_id : '',
            msg.target_study_status_id ? 'Status ' + msg.target_study_status_id : ''
          ].filter(Boolean).join(', ')}`;

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

  // Load sent messages on tab click
  document.getElementById('sent-tab')?.addEventListener('click', loadSentMessages);


});
