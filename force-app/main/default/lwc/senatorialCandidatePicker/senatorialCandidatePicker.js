import { LightningElement, track } from 'lwc';
import CANDIDATES from '@salesforce/resourceUrl/senatorialCandidates2025';

export default class SenatorialCandidatePicker extends LightningElement {

    @track candidates = [];
    @track selectedIds = new Set();
    columnSize = 14; 

    connectedCallback() {
        fetch(CANDIDATES)
            .then((res) => res.json())
            .then((data) => {
                this.candidates = data;
            });
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize();
    }
    
    get sortedCandidates() {
        return [...this.candidates].sort((a, b) => a.ballotNumber - b.ballotNumber);
    }

    // Clean up the event listener when the component is removed from the DOM
    disconnectedCallback() {
        window.removeEventListener('resize', this.handleResize);
    }

    get processedCandidates() {
        return this.sortedCandidates.map((candidate) => {
            const label = `${candidate.ballotNumber}. ${candidate.name} (${candidate.party})`;
            const comment = candidate.comment ? `${candidate.comment}`: '';
            return {
                ...candidate,
                label: label + comment,
                checked: this.selectedIds.has(candidate.ballotNumber)
            };
        });
    }

    get selectedCount() {
        return this.selectedIds.size; 
    }

    get selectedCountLabel() {
        return this.selectedCount === 1 ? 'candidate' : 'candidates';
    }
    get candidateColumns() {
        const columns = [];
        // Dynamically split the candidates into the appropriate number of columns based on the screen width
        for (let i = 0; i < this.processedCandidates.length; i += this.columnSize) {
            columns.push(this.processedCandidates.slice(i, i + this.columnSize));
        }
        return columns;
    }

    handleResize() {
        const width = window.innerWidth;
        if (width <= 480) {
            this.columnSize = 33;  // For very small screens, use 2 columns
        } else if (width <= 768) {
            this.columnSize = 22;  // For mobile devices, use 3 columns
        } else if (width <= 1024) {
            this.columnSize = 17;  // For tablets, use 4 columns
        } else {
            this.columnSize = 14;  // For large screens, use 5 columns
        }
    }

    candidateLabel(candidate) {
        return `${candidate.ballotNumber}. ${candidate.name} (${candidate.party})`;
    }

    isSelected(candidate) {
        return this.selectedIds.has(candidate.ballotNumber);
    }

    handleCheckboxChange(event) {
        const id = parseInt(event.target.dataset.id, 10);
        
        // Handle selection/deselection
        if (event.target.checked) {
            // If selecting a candidate, ensure no more than 12 are selected
            if (this.selectedIds.size >= 12) {
                event.target.checked = false;
                alert('You can only select up to 12 candidates.');
            } else {
                this.selectedIds.add(id); // Add candidate to selection
            }
        } else {
            this.selectedIds.delete(id); // Remove candidate from selection
        }
    
        // Update the candidate's comment regardless of whether it has one or not
        this.updateCandidateComment(id, event.target.checked ? this.getComment(id) : '');
        
        // Force reactivity by updating the candidates array explicitly
        this.candidates = [...this.candidates];
    }
    
    // Function to get the comment for a selected candidate
    getComment(id) {
        let comment = '';
        if (id === 11) {
            comment = ' — Budots pa rin sa 2025.';
        } else if (id === 22) {
            comment = ' — Sure ka na dyan?';
        } else if (id === 35) {
            comment = ' — 🎬📽️🎞️';
        } else if (id === 39) {
            comment = ' — Team itim?';
        } else if (id === 50) {
            comment = ' — 🥊💥';
        } else if (id === 53) {
            comment = ` — OH, C'MON!`;
        } else if (id === 55) {
            comment = ' — For REAL?';
        } else if (id === 58) {
            comment = ' — Ipe!!!';
        } else if (id === 66) {
            comment = ' — Camille--yahh';
        }
        return comment;
    }
    
    // Update the candidate's comment field
    updateCandidateComment(id, comment) {
        const candidate = this.candidates.find((c) => c.ballotNumber === id);
        if (candidate) {
            candidate.comment = comment; // Update comment field for the selected candidate
        }
    }


    printSelection() {
        // Get the selected candidates based on their IDs
        const selected = [...this.selectedIds]
            .map((id) => this.candidates.find((c) => c.ballotNumber === id))
            .filter(candidate => candidate); // Ensure we only include valid candidates
    
        // Sort the selected candidates by their ballot number
        selected.sort((a, b) => a.ballotNumber - b.ballotNumber);
    
        // Format the selected candidates for downloading
        const printable = selected
            .map((c) => `${c.ballotNumber}. ${c.name} (${c.party})`)
            .join('\n');
    
        // Create a Blob from the printable content
        const blob = new Blob([printable], { type: 'text/plain' });
    
        // Create a link element to download the Blob as a text file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_senatorial_candidates.txt'; 
    
        // Trigger the download
        link.click();
    }
    

}