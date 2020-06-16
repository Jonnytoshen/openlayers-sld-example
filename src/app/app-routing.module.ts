import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FileComponent } from './file';
import { DocumentComponent } from './document';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'file',
        pathMatch: 'full'
    },
    {
        path: 'file',
        component: FileComponent
    },
    {
        path: 'document',
        component: DocumentComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule {}