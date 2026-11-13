import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AiService, ChatMessage, RecommendedMovie } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';

interface DisplayMessage {
  role: 'user' | 'assistant';
  text: string;
  time: string;
  recommendedMovies?: RecommendedMovie[];
}

@Component({
  selector: 'app-ai-concierge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-concierge.component.html'
})
export class AiConciergeComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: DisplayMessage[] = [];
  inputMessage: string = '';
  isLoading: boolean = false;
  quickPrompts: string[] = [
    '🍿 Suggest an action movie playing tonight with good seats',
    '👨‍👩‍👧 Which movie is best for kids under 10?',
    '🎯 Where should I sit for the best IMAX sound experience?',
    '🔥 What are the top trending movies right now?'
  ];

  constructor(
    private aiService: AiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Welcome message from CineChain Concierge
    this.messages.push({
      role: 'assistant',
      text: "👋 Hello! I am CineChain's AI Movie Concierge powered by Gemini. Ask me about movie recommendations, seat advice, upcoming screenings, or kid-friendly shows!",
      time: this.currentTime()
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  sendMessage(customText?: string): void {
    const textToSend = customText || this.inputMessage.trim();
    if (!textToSend || this.isLoading) return;

    this.inputMessage = '';

    // Add user message to display
    this.messages.push({
      role: 'user',
      text: textToSend,
      time: this.currentTime()
    });

    this.isLoading = true;

    // Convert display messages to ChatMessage history for the API
    const history: ChatMessage[] = this.messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      text: m.text
    }));

    this.aiService.chat(textToSend, history).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.messages.push({
          role: 'assistant',
          text: res.reply,
          time: this.currentTime(),
          recommendedMovies: res.recommendedMovies
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('AI Concierge error:', err);
        this.messages.push({
          role: 'assistant',
          text: "I'm having a little trouble connecting to the CineChain concierge network. Based on our current schedule, please check out our Movies section or try asking again!",
          time: this.currentTime()
        });
      }
    });
  }

  useQuickPrompt(prompt: string): void {
    this.sendMessage(prompt);
  }

  private currentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
