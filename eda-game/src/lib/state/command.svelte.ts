class CommandManager {
  input = $state<string>('');
  isOpen = $state<boolean>(false);
  autocompleteItems = $state<string[]>(['/help', '/status', '/clear']);

  setInput(value: string): void {
    this.input = value;
  }

  execute(): 'exit' | 'help' | 'status' | 'clear' | null {
    const cmd = this.input.trim();
    this.input = '';

    switch (cmd) {
      case '/exit':
        return 'exit';
      case '/help':
        return 'help';
      case '/status':
        return 'status';
      case '/clear':
        return 'clear';
      default:
        return null;
    }
  }

  reset(): void {
    this.input = '';
    this.isOpen = false;
    this.autocompleteItems = ['/help', '/status', '/clear'];
  }
}

export const commandState = new CommandManager();
