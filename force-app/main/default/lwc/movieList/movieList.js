import { LightningElement, wire, track } from 'lwc';
import getMovies from '@salesforce/apex/MovieSearchController.getMovies';

export default class MovieList extends LightningElement {


    movieName='';
    searchText='';
    placeholderText='Please enter the title';
    movies=[];

    handleChange(event){
        this.movieName = event.target.value;
    }

    handleClick(){
        this.searchText = this.movieName;
        console.log('search text is ' + this.searchText); 
    }

    @wire(getMovies, { searchText: '$searchText' })
    fetchMovies({ data, error }) {
        if(this.searchText) {
            if (data) {
                try {
                    const parsedData = JSON.parse(data);
                    console.log('Data:', parsedData);
                    if (parsedData.success) {
                        this.movies = parsedData.result || [];
                        this.placeholderText = '';
                    } else {
                        console.log('Title not found:', parsedData);
                        this.movies = [];
                        this.placeholderText = 'Title not found';
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    this.movies = [];
                    this.placeholderText = 'Invalid data format';
                }
            } else if (error) {
                console.error('Error:', error);
                this.movies = [];
                this.placeholderText = 'An error occurred while searching for title';
            }
        }
    }
}