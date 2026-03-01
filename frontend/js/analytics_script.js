document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize the Bar Chart
    const ctx = document.getElementById('viewChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Viewed', 'Not Viewed'],
            datasets: [{
                label: 'Student Reach',
                data: [412, 118],
                backgroundColor: ['#4caf50', '#f44336'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 2. Sample Data for Students
    const viewedStudents = ["Rakesh G", "Suresh Kumar", "Priya Dharshini", "Anjali M", "Vikram Singh", "Abinaya R", "Dinesh K", "Manoj P"];
    const unseenStudents = ["Ram G", "Santhosh L", "Naveen B", "Kavya S", "Rahul J", "Meena W"];

    // 3. Populate Lists
    const viewedList = document.getElementById('viewedList');
    const unseenList = document.getElementById('unseenList');

    viewedStudents.forEach(name => {
        const div = document.createElement('div');
        div.className = 'student-name';
        div.innerText = "✓ " + name;
        viewedList.appendChild(div);
    });

    unseenStudents.forEach(name => {
        const div = document.createElement('div');
        div.className = 'student-name';
        div.innerText = "✗ " + name;
        unseenList.appendChild(div);
    });
});