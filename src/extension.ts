import * as vscode from 'vscode';
let myStatusBarItem: vscode.StatusBarItem;

let secMin = 60;
let breakMin = 5 * secMin;
let breakMax = 20 * secMin;
let work = 25 * secMin;
let workInterval = 4;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.startpomodoro', () => {
		const pomodoro = new Pomodoro();
		pomodoro.getSettings();
		pomodoro.workflow(1);
	});

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);

	context.subscriptions.push(disposable);
}

class Pomodoro {

	fragmento: number = 1;

	getSettings() {
		const config = vscode.workspace.getConfiguration('pomodoro');
		breakMin = config.breakMin * secMin;
		breakMax = config.breakMax * secMin;
		work = config.work * secMin;
		workInterval = config.workInterval;
	}

	workflow(ciclo: number) {
		if (ciclo === 1 || ciclo === 2 || ciclo === 3) {
			this.getTime(ciclo, work, false).then(c => {
				vscode.window.showInformationMessage(`Ciclo finalizado - Tomar un descanso corto`);
				this.fragmento = 2;
				this.getTime(ciclo, breakMin, true).then(d => {
					vscode.window.showInformationMessage(`Fin de descanso - Comenzar con nuevo ciclo`);
					this.fragmento = 1;
				});
			});
		}

		if (ciclo === 4) {
			this.getTime(ciclo, work, false).then(cf => {
				vscode.window.showInformationMessage(`Ciclo finalizado - Tomar un descanso largo`);
				this.fragmento = 2;
				this.getTime(ciclo, breakMax, true).then(d => {
					vscode.window.showInformationMessage(`Fin de descanso - Comenzar con nuevo pomodoro`);
					this.fragmento = 1;
				});
			});
		}
	}


	getTime(ciclo: number, msec: number, eject: boolean): Promise < number > {
		return new Promise((resolve, reject) => {
			let interval = setInterval(() => {
				msec--;
				let time = this.fancyTime(msec);

				this.updateStatusBar(`Pomodoro ciclo: ${ciclo} tiempo restante: ${time}`);

				if (msec === 0) {
					clearInterval(interval);
					if (!eject) {
						this.workflow(ciclo += 1);
					}
					resolve();
				}
			}, 1000);
		});
	}

	fancyTime(data: number) {
		const minutes = ~~((data % 3600) / 60);
		const seconds = ~~data % 60;

		return `${minutes < 10 ? `0` : ``}${minutes}:${seconds < 10 ? `0` : ``}${seconds}`;
	}

	updateStatusBar(data: string) {
		let color = this.fragmento === 1 ? 'red' : 'green';
		let icon = this.fragmento === 1 ? '🍅' : '☕';

		myStatusBarItem.text = icon + " " + data;
		myStatusBarItem.color = color;
		myStatusBarItem.show();
	}
}

export function deactivate() {}