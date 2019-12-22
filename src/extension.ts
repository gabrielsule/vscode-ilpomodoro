import * as vscode from 'vscode';

let _statusBar: vscode.StatusBarItem;
let _action: actions;
let _fragment: fragments;
let _cycle: number = 0;

// let secMin = 60;
// let minBreak = 5 * secMin;
// let maxBreak = 20 * secMin;
// let work = 25 * secMin;
// let workInterval = 4;

let secMin = 5;
let minBreak = 1 * secMin;
let maxBreak = 1 * secMin;
let work = 1 * secMin;
let workInterval = 2;


enum fragments {
	task,
	minBreak,
	maxBreak,
}

enum actions {
	start,
	stop,
	reset,
}

export function activate(context: vscode.ExtensionContext) {

	const pomodoro = new Pomodoro();

	let startPomodoro = vscode.commands.registerCommand('extension.startpomodoro', () => {
		pomodoro.workflow(1, fragments.task, actions.start);
	});

	let stopPomodoro = vscode.commands.registerCommand('extension.stoppomodoro', () => {
		pomodoro.clickStatusBar();
	});

	_statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);

	context.subscriptions.push(startPomodoro, stopPomodoro);
}

class Pomodoro {
	time: number = 0;

	constructor() {
		//this.getSettings();
	}

	getSettings() {
		const config = vscode.workspace.getConfiguration('pomodoro');
		minBreak = config.minBreak * secMin;
		maxBreak = config.maxBreak * secMin;
		work = config.work * secMin;
		workInterval = config.workInterval;
	}

	workflow(cycle: number, fragment: fragments, action: actions) {
		_action = action;
		_fragment = fragment;
		_cycle = cycle;

		if (_action === actions.start) {
			switch (fragment) {
				case fragments.task:
					this.time = work;
					this.getTime();
					vscode.window.showInformationMessage(`🍅 comienzo de pomodoro ${work} min`);
					break;

				case fragments.minBreak:
					this.time = minBreak;
					this.getTime();
					vscode.window.showInformationMessage(`☕ comienza descanso corto ${minBreak} min`);
					break;

				case fragments.maxBreak:
					this.time = maxBreak;
					this.getTime();
					vscode.window.showInformationMessage(`☕ comienza descanso largo ${maxBreak} min`);
					break;

				default:
					break;
			}
		}
		if (_action === actions.stop) {
			this.time = 0;
			this.updateStatusBar(this.fancyTime(this.time));
		}
	}

	setAction() {
		if (_cycle < workInterval && this.time === 0) {
			let frag = _fragment === fragments.task ? fragments.minBreak : fragments.task;
			if (_fragment === fragments.minBreak) {
				_cycle++;
			}
			this.workflow(_cycle, frag, actions.start);
		}
		if (_cycle === workInterval && this.time === 0) {
			if (_fragment === fragments.maxBreak && this.time === 0) {
				this.workflow(0, 0, actions.stop);
			} else {
				let frag = _fragment === fragments.task ? fragments.maxBreak : fragments.task;
				this.workflow(_cycle, frag, actions.start);
			}
		}
	}

	getTime() {
		let interval = setInterval(() => {
			this.time--;
			if (this.time === 0) {
				clearInterval(interval);
			}
			this.updateStatusBar(this.fancyTime(this.time));
			this.setAction();
		}, 1000);
	}

	fancyTime(data: number) {
		const minutes = ~~((data % 3600) / 60);
		const seconds = ~~data % 60;

		return `${minutes < 10 ? `0` : ``}${minutes}:${seconds < 10 ? `0` : ``}${seconds}`;
	}

	clickStatusBar() {
		_action = actions.start === _action ? actions.reset : actions.start;
		this.workflow(1, _fragment, _action);
	}

	updateStatusBar(data: string) {
		let color = fragments.task === _fragment ? 'red' : 'green';
		let icon = fragments.task === _fragment ? '🍅' : '☕';
		let title = fragments.task === _fragment ? 'pomodoro' : 'break';
		let goAction = actions.start === _action ? '$(debug-restart)' : '$(debug-continue)';

		_statusBar.text = `${icon} ${title} ${_cycle}/${workInterval}  ${data} ${goAction}`;
		_statusBar.color = color;
		_statusBar.command = 'extension.stoppomodoro';
		_statusBar.show();
	}
}

export function deactivate() {}