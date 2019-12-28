import * as vscode from 'vscode';
const _childProc = require('child_process');
const _path = require('path');

let _statusBar: vscode.StatusBarItem;
let _action: actions;
let _fragment: fragments;
let _cycle = 0;
let _interval: any;

// let secMin = 60;
// let minBreak = 5 * secMin;
// let maxBreak = 20 * secMin;
// let work = 25 * secMin;
// let workInterval = 4;

let secMin = 10;
let minBreak = 10 * secMin;
let maxBreak = 10 * secMin;
let work = 10 * secMin;
let workInterval = 4;
let sound = true;


enum fragments {
	task,
	minBreak,
	maxBreak,
}

enum actions {
	start,
	stop,
}

export function activate(context: vscode.ExtensionContext) {

	const pomodoro = new Pomodoro();

	let startPomodoro = vscode.commands.registerCommand('extension.startpomodoro', () => {
		pomodoro.workflow(1, fragments.task, actions.start);
	});

	let stopPomodoro = vscode.commands.registerCommand('extension.stoppomodoro', () => {
		pomodoro.clickStatusBar();
	});

	let viewStatistics = vscode.commands.registerCommand('extension.viewstatistics', () => {
		console.log('Estadisticas');
	});

	_statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);

	context.subscriptions.push(startPomodoro, stopPomodoro, viewStatistics);
}

class Pomodoro {
	time: number = 0;

	constructor() {
		this.getSettings();
	}

	getSettings() {
		const config = vscode.workspace.getConfiguration('pomodoro');
		minBreak = config.minBreak * secMin;
		maxBreak = config.maxBreak * secMin;
		work = config.work * secMin;
		workInterval = config.workInterval;
		sound = config.sound;
	}

	workflow(cycle: number, fragment: fragments, action: actions) {
		_action = action;
		_fragment = fragment;
		_cycle = cycle;

		if (_action === actions.start) {
			switch (fragment) {
				case fragments.task:
					this.time = work;
					this.setTime();
					vscode.window.showInformationMessage(`🍅 comienzo de pomodoro ${work} min`);
					this.setSound();
					break;

				case fragments.minBreak:
					this.time = minBreak;
					this.setTime();
					vscode.window.showInformationMessage(`☕ comienza descanso corto ${minBreak} min`);
					this.setSound();
					break;

				case fragments.maxBreak:
					this.time = maxBreak;
					this.setTime();
					vscode.window.showInformationMessage(`☕ comienza descanso largo ${maxBreak} min`);
					this.setSound();
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

	setTime() {
		_interval = setInterval(() => {
			this.time--;

			if (this.time === 0) {
				clearInterval(_interval);
				this.time = 0;
			}

			this.updateStatusBar(this.fancyTime(this.time));
			this.setAction();
		}, 1000);
	}

	setSound() {
		if (sound) {
			if (process.platform === 'win32') {
				let _playerPath = _path.join(__dirname, '..', 'resources', 'sound', 'play.exe');
				_childProc.execFile(_playerPath, ['sound.wav']);
			}
		}
	}

	fancyTime(data: number) {
		const minutes = ~~((data % 3600) / 60);
		const seconds = ~~data % 60;

		return `${minutes < 10 ? `0` : ``}${minutes}:${seconds < 10 ? `0` : ``}${seconds}`;
	}

	clickStatusBar() {
		if (actions.start === _action) {
			clearInterval(_interval);
			this.workflow(0, 0, actions.stop);
		} else {
			this.workflow(1, fragments.task, actions.start);
		}
	}

	updateStatusBar(data: string) {
		let color = fragments.task === _fragment ? 'red' : 'green';
		let icon = fragments.task === _fragment ? '🍅' : '☕';
		let title = fragments.task === _fragment ? 'pomodoro' : 'break';
		let tooltip = actions.start === _action ? 'stop pomodoro' : 'start pomodoro';
		let goAction = actions.start === _action ? '$(debug-restart)' : '$(debug-continue)';

		_statusBar.text = `${icon} ${title} ${_cycle}/${workInterval}  ${data} ${goAction}`;
		_statusBar.color = color;
		_statusBar.tooltip = tooltip;
		_statusBar.command = 'extension.stoppomodoro';
		_statusBar.show();
	}
}

export function deactivate() {}