 document.getElementById('photo').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const preview = document.getElementById('photoPreview');

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function (e) {
                preview.style.backgroundImage = `url('${e.target.result}')`;
                preview.style.display = 'block';
            };

            reader.readAsDataURL(file);
        } else {
            preview.style.backgroundImage = '';
            preview.style.display = 'none';
        }
    });    