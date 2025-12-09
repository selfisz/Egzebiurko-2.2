/**
 * Statistics Store - Data Analysis and Reporting
 */

import store from '../../store/index.js';

// Add statistics state
if (!store.state.statisticsData) store.state.statisticsData = {};
if (!store.state.statisticsLoading) store.state.statisticsLoading = false;
// Alias for views that subscribe to `statistics`
if (!store.state.statistics) store.state.statistics = store.state.statisticsData;

// Mutations
store.registerMutation('SET_STATISTICS_DATA', (state, data) => {
    state.statisticsData = data;
    // Keep alias in sync for views using `statistics`
    state.statistics = data;
});

store.registerMutation('SET_STATISTICS_LOADING', (state, loading) => {
    state.statisticsLoading = loading;
});

// Actions
store.registerAction('generateStatistics', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    commit('SET_STATISTICS_LOADING', true);
    
    try {
        const [cases, cars, notes, pdfs] = await Promise.all([
            state.db.getAll('cases'),
            state.db.getAll('garage'),
            state.db.getAll('notes'),
            state.db.getAll('pdfs')
        ]);

        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        // Cases statistics
        const casesByStatus = cases.reduce((acc, case_) => {
            acc[case_.status || 'new'] = (acc[case_.status || 'new'] || 0) + 1;
            return acc;
        }, {});

        const casesByUrgency = cases.reduce((acc, case_) => {
            acc[case_.urgent ? 'urgent' : 'normal'] = (acc[case_.urgent ? 'urgent' : 'normal'] || 0) + 1;
            return acc;
        }, {});

        const casesThisMonth = cases.filter(case_ => {
            const caseDate = new Date(case_.date);
            return caseDate.getMonth() === thisMonth && caseDate.getFullYear() === thisYear;
        }).length;

        // Cars statistics
        const carsByStatus = cars.reduce((acc, car) => {
            acc[car.status || 'Zajęcie'] = (acc[car.status || 'Zajęcie'] || 0) + 1;
            return acc;
        }, {});

        const favoriteCars = cars.filter(car => car.favorite).length;
        const totalCarValue = cars.reduce((sum, car) => sum + (parseFloat(car.value) || 0), 0);

        // Notes statistics
        const notesThisMonth = notes.filter(note => {
            const noteDate = new Date(note.date);
            return noteDate.getMonth() === thisMonth && noteDate.getFullYear() === thisYear;
        }).length;

        // PDF

        const statistics = {
            cases: {
                total: cases.length,
                thisMonth: casesThisMonth,
                byStatus: casesByStatus,
                byUrgency: casesByUrgency,
                favorites: cases.filter(case_ => case_.isFavorite).length
            },
            cars: {
                total: cars.length,
                byStatus: carsByStatus,
                favorites: favoriteCars,
                totalValue: totalCarValue
            },
            notes: {
                total: notes.length,
                thisMonth: notesThisMonth
            },
            pdf: {
                total: pdfs.length,
                totalPages: pdfs.reduce((sum, pdf) => sum + (pdf.pages || 0), 0)
            },
            generated: today.toISOString()
        };

        commit('SET_STATISTICS_DATA', statistics);
        return statistics;
    } catch (error) {
        console.error('[Statistics] Generate error:', error);
        throw error;
    } finally {
        commit('SET_STATISTICS_LOADING', false);
    }
});

store.registerAction('generateDailyReport', async ({ commit, state }) => {
    if (!state.db) throw new Error('Database not initialized');
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const [cases, cars, notes] = await Promise.all([
            state.db.getAll('cases'),
            state.db.getAll('garage'),
            state.db.getAll('notes')
        ]);

        // Today's activity
        const todayCases = cases.filter(case_ => 
            case_.date && case_.date.startsWith(today)
        );

        const todayCars = cars.filter(car => 
            car.date && car.date.startsWith(today)
        );

        const todayNotes = notes.filter(note => 
            note.date && note.date.startsWith(today)
        );

        const report = {
            date: today,
            summary: {
                newCases: todayCases.length,
                newCars: todayCars.length,
                newNotes: todayNotes.length
            },
            details: {
                cases: todayCases.map(case_ => ({
                    no: case_.no,
                    debtor: case_.debtor,
                    status: case_.status,
                    urgent: case_.urgent
                })),
                cars: todayCars.map(car => ({
                    make: car.make,
                    model: car.model,
                    status: car.status
                })),
                notes: todayNotes.map(note => ({
                    title: note.title,
                    content: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '')
                }))
            }
        };

        return report;
    } catch (error) {
        console.error('[Statistics] Daily report error:', error);
        throw error;
    }
});

store.registerAction('exportStatistics', async ({ state }, format = 'json') => {
    try {
        const data = state.statisticsData;
        
        if (!data) {
            throw new Error('No statistics data available. Generate statistics first.');
        }

        let content, filename, mimeType;

        switch (format.toLowerCase()) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                filename = `statistics_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
                break;
                
            case 'csv':
                content = convertToCSV(data);
                filename = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
                break;
                
            default:
                throw new Error('Unsupported format. Use "json" or "csv".');
        }

        // Download file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { filename, success: true };
    } catch (error) {
        console.error('[Statistics] Export error:', error);
        throw error;
    }
});

// Helper function to convert statistics to CSV
function convertToCSV(data) {
    const csvRows = [];

    // Header
    csvRows.push('Kategoria,Metryka,Wartość');

    // Cases data
    csvRows.push(`Sprawy,Łącznie,${data.cases.total}`);
    csvRows.push(`Sprawy,W tym miesiącu,${data.cases.thisMonth}`);
    csvRows.push(`Sprawy,Ulubione,${data.cases.favorites}`);
    
    Object.entries(data.cases.byStatus).forEach(([status, count]) => {
        csvRows.push(`Sprawy - Status,${status},${count}`);
    });

    // Cars
    csvRows.push(`Pojazdy,Łącznie,${data.cars.total}`);
    csvRows.push(`Pojazdy,Ulubione,${data.cars.favorites}`);
    csvRows.push(`Pojazdy,Wartość całkowita,${data.cars.totalValue}`);
    
    Object.entries(data.cars.byStatus).forEach(([status, count]) => {
        csvRows.push(`Pojazdy - Status,${status},${count}`);
    });

    // Notes
    csvRows.push(`Notatki,Łącznie,${data.notes.total}`);
    csvRows.push(`Notatki,W tym miesiącu,${data.notes.thisMonth}`);

    // PDF

    return csvRows.join('\n');
}

export default {
    // Original low-level helpers
    generate: () => store.dispatch('generateStatistics'),
    generateDailyReport: () => store.dispatch('generateDailyReport'),
    export: (format) => store.dispatch('exportStatistics', format),
    getData: () => store.get('statistics') || store.get('statisticsData'),
    isLoading: () => store.get('statisticsLoading'),

    // High-level API expected by StatisticsView
    loadStatistics: () => store.dispatch('loadStatistics'),
    updateStatistics: (dateRange) => store.dispatch('updateStatistics', dateRange),
    refreshStatistics: () => store.dispatch('refreshStatistics'),
    exportStatistics: (format = 'json') => store.dispatch('exportStatistics', format)
};
