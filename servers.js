let currentPage = 1;
let currentQuery = '';

// Search function update karein
async function searchSongs() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return alert('Please type a song name!');
    
    currentQuery = query;
    currentPage = 1;
    document.getElementById('songList').innerHTML = '';
    await fetchSongs();
}

async function fetchSongs() {
    document.getElementById('loader').style.display = 'block';
    
    let success = false;
    for (let api of API_ENDPOINTS) {
        try {
            let response = await fetch(`${api}/search/songs?query=${encodeURIComponent(currentQuery)}&page=${currentPage}&limit=50`);
            if (!response.ok) {
                response = await fetch(`${api}/result?query=${encodeURIComponent(currentQuery)}`);
            }
            const data = await response.json();
            let songs = data.data?.results || data.results || data;
            
            if (songs && songs.length > 0) {
                songs.forEach(song => {
                    // ... (Same card creation logic)
                });
                currentPage++; // Agli baar ke liye page badha dein
                success = true;
                break;
            }
        } catch (error) { continue; }
    }
    
    document.getElementById('loader').style.display = 'none';
}