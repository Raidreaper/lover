import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, Smile, Send, Hash, Copy, Users, Plus, Heart, MessageCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import HamburgerMenu from "@/components/HamburgerMenu";
import { useAuth } from "@/contexts/AuthContext";

const MultiplayerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState("");
  const [isInSession, setIsInSession] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: string, timestamp: Date}>>([]);
  const [messageInput, setMessageInput] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [playerName, setPlayerName] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Mock questions for numbers 1-400
  const questions = [
  "Birthday",
  "Worst mistake",
  "Ur greatest fear",
  "Crush",
  "Best colour",
  "Do u or have u smoked?",
  "Do u drink alcohol?",
  "Do u go for nyt parties?",
  "Last time u cried and wat caused it",
  "Ur dreams",
  "Have u or do u maturate?",
  "Happiest moment",
  "Best memory",
  "Last kiss and wit who",
  "Do you watch porn?",
  "Your best body part",
  "Ever been fucked hard nd u cried?",
  "Complete d**k",
  "Complete p***y",
  "Ur most enjoyable sex,tel me abt it in details",
  "Full name",
  "If u have d chance wil u date me?",
  "Will u kiss me?",
  "Kiss or hug",
  "Favorite song",
  "Favorite movie",
  "Ever kissed a same gender person?",
  "Do u love bj?",
  "Send me ur number",
  "Ever maked out?",
  "Wanna explore me?",
  "Wanna kiss me?",
  "Wanna fuck me?",
  "Wanna date me?",
  "Ever been abused?",
  "Best hubby",
  "Tel me 3 deepest secrets",
  "Send me ur nude pics or porn videos",
  "Favorite body part of ur opposite gender",
  "Big dicks or normal dicks",
  "Big pussy or normal pussy",
  "Promise to kiss me wen we meet",
  "Tell me how u really feel about me",
  "Tell me a story",
  "Do u wear bra?",
  "Do u always wear pant?",
  "Promise to watch porn wit me or gv me a Bj",
  "Will u let me finger u or stroke ur dick?",
  "Wat age did u have ur first sex",
  "Wat year did u have ur first sex",
  "Player or loyal",
  "Single or taken",
  "Have you ever been played?",
  "Have you ever played someone?",
  "Tell me an erotic story",
  "Last sex",
  "Ever had sex wit a same gender person?",
  "Use my pic as ur dp for 1 week",
  "Send me ur breast or chest picture",
  "Do u sex chat?",
  "If u see me naked, wat will u do",
  "Shy or bold",
  "Ever slept naked?",
  "Virgin?",
  "Wat turns u on",
  "What do you love doing the most",
  "Ever begged for sex?",
  "D craziest tin u have ever done",
  "Best friend",
  "Ever had sex?",
  "Age",
  "Are you naughty?",
  "Naughtiest tin u have ever done",
  "Ever exchanged nude?",
  "Buy me a gift",
  "Wil you let me touch you?",
  "Do you love me?",
  "How do you want d dick or pussy to be.",
  "Sex chat with me",
  "Have some mistakenly seeing ur dick or pussy?",
  "What gets u wet",
  "Last time u felt like having sex",
  "Favorite clothes",
  "Ask me anything",
  "Promise to have sex with me",
  "Nickname",
  "Favorite sex position",
  "How long do you want sex to be.",
  "Do you love sex?",
  "Something u will change about yourself",
  "Send me two of your sexiest pics",
  "Tell me how you had ur last time sex in details",
  "How much do you enjoy sex",
  "Tell me things you want from me.",
  "Hard fuck or normal",
  "Send me 2 pics of your dick",
  "Send me 2 pics of your pussy",
  "Hairy dick/pussy or shaved",
  "Send me your dance videos",
  "Will you fuck me?",
  "Ever fucked someone you don't love?",
  "What do you like in a girl",
  "What do you like in a boy",
  "Tell me things you want us to do together",
  "Send me a sex video of yourself",
  "How much do you love sex.",
  "Do you prefer being sucked on your pussy or rather have sex.",
  "Are you horny right now",
  "Do you prefer being sucked on your dick or rather have sex",
  "kiss each other for a whole minute",
  "will you give me a lap dance",
  "what is your favorite body part on a girl?",
  "which do you prefer wet or dry kiss",
  "what is your favorite body part on a boy",
  "have you ever had a sex dream",
  "what on your mind right now",
  "will you come over my place",
  "if we were both inside the room what will you do to me?",
  "What don't you like about me?",
  "Did you like your first kiss?",
  "Have you ever decided to kiss or make out with a guy just because you were Horny?",
  "Which do you like the most, your boobs or your bum?",
  "What are you wearing right now?",
  "If you ask me to do something naughty what would you prefer I do?",
  "Missionary or doggy-style?",
  "What turns you on the most in a guy?",
  "Is it okay if I kiss you?",
  "How you react if I kissed you immediately I see you next time?",
  "How did you get so beautiful?",
  "Assuming we were stuck together alone in a house for a whole day, what do you think we would do?",
  "What color of panties do you prefer and why?",
  "What is the color of the underpants you are wearing right now?",
  "Are you a boobs or ass man?",
  "Where you do like being touched the most?",
  "Have you ever thought about kissing me?",
  "What if I was naked and laying in your bed?",
  "Do you want to help keep my body warm?",
  "How long do you think a guy should last on bed?",
  "Do you like cooking?",
  "Who is your favorite celebrity?",
  "Have you ever had a crush on one of your cousins?",
  "What is your worst habit?",
  "Have you ever dated two girls at the same time?",
  "While you are kissing, what types of other things you prefer to be done simultaneously?",
  "Did you know I can make you shake all over if you let me rub my cap on your clit?",
  "What do my lips taste like?",
  "How do you feel about being fingered?",
  "Where do you like it best? Back or front?",
  "Where is somewhere in my house you would like to have sex in apart fro the bedroom?",
  "Do you want me to talk dirty?",
  "Show me a porn video you'd want us to act out together",
  "Try not to get turned on while I sit on your lap and kiss your neck for 60 seconds.",
  "Would you rather spank someone or be spanked?",
  "Kiss my nipple for 60 seconds.",
  "What's your biggest sexual fear?",
  "If you had to fuck one animal, what animal would you pick?",
  "Do you love me? How much?",
  "Would you take a shower with me?",
  "How often do you watch something naughty?",
  "How often do you trim down there?",
  "How many people have seen you naked?",
  "What are you wearing?",
  "What's something you want me to do to you?",
  "Wide or tight p***y",
  "How many kids would you like to have?",
  "Twerk on my lap with only your underwear",
  "wanna suck my pussy?",
  "wanna suck my dick?",
  "Do you prefer rough or slow sex?",
  "Do you like your partner to be silent or loud?",
  "Have you ever cheated in an exam?",
  "When was the first time that you watched porn?",
  "Tell me a Dirty Truth about you that no one else knows?",
  "Do you think I'm Hot?",
  "Who would you most like to make out with?",
  "When is the last time that you touched yourself?",
  "Do you ever walk around in public without any underwear on?",
  "What do you think is the absolutely sexiest part of my body?",
  "If I was tied down to the bed right now, what would you do to me?",
  "Have you ever accidentally grabbed someones butt?",
  "Name one celebrity you would want to make out with",
  "When was the last time you masturbated?",
  "Do you like to listen to music while having sex?",
  "Kiss me passionately?",
  "Tell me how you would make love to me.",
  "Tell me something to get me aroused.",
  "Does naughty talk get you aroused?",
  "Have you ever witnessed people having sex?",
  "which do u prefer, fuck through panties? or fuck without panties?",
  "will u romance me without being asked?",
  "Call me and say \"I Love You\" along with my name as loud as you can.",
  "Do you prefer texting me or talking to me on the phone?",
  "If you were famous, what would you be famous for?",
  "if I was in the mood for sex, will u give it to me?",
  "What's one thing you can't live without?",
  "What's the last thing you searched on your phone?",
  "Of the people in this room, who do you most want to make out with?",
  "What's your biggest sexual fear?",
  "if your p***y was the key to my success will you give it to me",
  "How do you really feel about sex?",
  "How would you feel if my dick was on your pussy right now?",
  "Do you think my pussy will be sweeter than honey",
  "Do you think my dick wil be sweeter than honey",
  "Hw will u feel if my p***y was on your dick right now?",
  "Do u prefer skin to skin or condom?",
  "Do you like being lick on your pussy while sex is going on",
  "If u were to choose a sex time for both of us, how long will that be?",
  "Do I make u nervous",
  "What is your position on premarital sex?",
  "Tell me one thing I could do that would make you immediately orgasm.",
  "What is your favorite body part for me to suck on?",
  "Would you prefer to dominate me in bed or do you want me to dominate you in bed?",
  "Which is your favorite kind of sex: soft, slow, and sweet or aggressive, fast, and feisty?",
  "If we could only have sex in one position for a month, what position would you pick pussy or ass",
  "Is there something you've seen in a steamy movie that you'd like to try?",
  "What do you think is the sexiest part of your body is?",
  "Would you consider yourself flexible (in bed)?",
  "Why did you break up with your last boyfriend or girlfriend?",
  "What position have you always wanted to try?",
  "What do you wish we did in the bedroom?",
  "Where do you love to have sex?",
  "If you could have sex in any location in the world, where would it be?",
  "Where, and how, can I touch you that will turn you on?",
  "Hw will u like to be sex on your first sex",
  "If I was with you, which part of my body would you want to lick first?",
  "If I was with you right now, what would you do with me?",
  "If u were asked to give me a sex position, were will that be p***y or ass?",
  "Name three things you will like to do during sex.",
  "Hw many times a week would you want to have sex?",
  "Do you think it's possible to have a friend with benefits?",
  "If I allowed you to do anything to me what would you do?",
  "How much do you like dirty talk?",
  "How will you take it if I put my hand underneath your shirt right now?",
  "What color of underwear do you think I am wearing right now?",
  "How likely will you allow me to touch you down there?",
  "Have you ever wanted to tear my clothes off?",
  "Which position is your favorite for us?",
  "If you could choose anything on my body to see right now what would it be?",
  "What is the difference to you between sex and making love?",
  "What's your secret move to turn a guy on?",
  "What should a guy do to make you wet?",
  "Did you ever felt hot in shower while rubbing your body?",
  "Do you like your boobs being pressed?",
  "Can you tell me some reasons why I like you?",
  "Do you miss me right now?",
  "Is there anything you're too nervous to tell me in person?",
  "Do you want to see me without my shirt on?",
  "Wat part of your body will you let me touch?",
  "Would u like to be kissed while having sex?",
  "Name the sex position you would like us to try?",
  "Hw many sex position do you know?",
  "Are you a jealous person",
  "Have someone ever make an attempt to have sex with you?",
  "Would you like me to be the person that will disvirgins you?",
  "How would you feel if someone sends u pron?",
  "At wat age do u plan to get married?",
  "How long can u last in bed?",
  "Do u discuss your relationship with your friends?",
  "Wat do u feel like when sex is on your mind?",
  "Do you think we'd do something funny if we get drunk together?",
  "Do you think you're a good kisser?",
  "Where on your body would you like me to massage?",
  "What would you do if I come to you naked?",
  "What would you ask me to do for you if I were naked right now?",
  "Can you take my panties off with just your teeth?",
  "How would you start with me if I was in your bed right now?",
  "What would you do if we were home alone naked together?",
  "What would you like to hear from me while we do it?",
  "If you could only feel me in one place, where would it be?",
  "If you are still a virgin, how would you demand it?",
  "Have you ever been seduced by someone?",
  "Would you ever want to play dirty with me?",
  "Do u like me being ontop u or u being ontop me?",
  "Do you like it when I pull your hair during sex?",
  "Are u a dick sucker",
  "How can I make sex more enjoyable for you?",
  "Does knowing that people can hear us having sex turn you on?",
  "Do you consider yourself a naughty girl? If yes, prove it.",
  "What is the one thing you can never resist and that instantly gets you wet?",
  "Would you have sex with me while somebody is watching us?",
  "Would you make out with another girl while I watch?",
  "Would you like it if I sent you naked pictures of me?",
  "Are you confident about showing your naked body?",
  "Have you ever been hot for a teacher?",
  "are you a shy guy, sexually?",
  "Would you prefer my dick deep inside your pussy or at the bottom?",
  "What part of my body would you want me to tattoo?",
  "have you ever stared at my butt or chest?",
  "Is laughing in sex okay, or it has to be serious?",
  "Have you ever tried edible underwear?",
  "Do you like experimenting with different positions, or your favorite?",
  "If you could choose anything on my body to see right now what would it be?",
  "Which part of guys body you want to touch or feel?",
  "Have you ever kissed a girl?",
  "How many minutes should my d*k or p**y should stay inside yours without removing it?",
  "Wanna fuck my ass or pussy?",
  "Do you prefer to take the lead for sex?",
  "What do you think is the sexiest thing about my body?",
  "How do you like to be touched by me?",
  "How would you start with me if I was in your bed right now?",
  "Can I watch you play with your stuff",
  "Do u have a condom?",
  "Figure out how my pussy will looks like",
  "Figure out how my dick wii looks like",
  "If I was home alone and I ask for sex will u let me placed my dick on your pussy?",
  "If sex was wat I asked as a birthday gift will u give it to me?",
  "Do u think your mom was a virgin when your dad met her?",
  "If we were to have sex will u let any one knows about it?",
  "Do u prefer being sucked on your pussy before sex?",
  "Do u prefer being sucked on your dick before sex?",
  "What do you want sex, romance,wet kiss?",
  "What should I say if I wanted sex from u?",
  "Wat would you say if I said I wanted sex?",
  "if we were both shy for sex mood, hw Would u make mi interested?",
  "Who was your first girlfriend",
  "What turns you on most during sex?",
  "How many times have you been in love?",
  "Who are your ex-girlfriends, (if any) and what made the relationship end as it did?",
  "Have you ever lied to me?",
  "Will u be surprised if I ask u for sex?",
  "Last time you had a wet dream?",
  "How will it feel like to lose your virginity?",
  "Would you ever watch porn with a girl?",
  "What would you do if I put my hands under your shirt?",
  "If you are still a virgin, what do you want your first time to be like?",
  "Do you like to be loud during s..x?",
  "Do you like it when I don't wear any underwear?",
  "Do you want to cuddle with me?",
  "What is your favorite position when you are on top?",
  "Would you ever want to be blindfolded during sex?",
  "What is the quickest that you think you can undress me?",
  "Do you think you can get naked in less than 5 seconds during sex?",
  "Do you like to do it with clothes on or off?",
  "Do you want to spank me?",
  "Your lips look lonely. Do you want my lips to keep them company?",
  "Do you think that I can handle you?",
  "Do you like being naked or are you shy about it?",
  "If you realized that someone was watching you have s..x, would you stop or would you keep going?",
  "Is there anything that you would not do in bed?",
  "How long will it take you to get over here and into my pants?",
  "What is the sexiest outfit that you can think of?",
  "Does talking dirty turn you on, and do you want to try it with me?",
  "Are you into phone sex, and do you want to try it?",
  "What is the thing that makes you feel good the most during sex?",
  "Do you like foreplay or do you like going straight to business?",
  "Do you like it when I come inside you?",
  "Do you like to watch me as I change clothes?",
  "Do you like it when I touch you slowly all over your body?",
  "Which part of me do you miss the most right now?",
  "If we only had 20 minutes together, what would we do?",
  "Does thinking about me make you wet?",
  "How long should foreplay take before sex?",
  "Describe to me in detail what it feels like when I'm inside you.",
  "Do you like it when I tell you what to do?",
  "What is a sure way to turn you on within seconds?",
  "Do you prefer younger or older men?",
  "Are you enjoying these flirty questions?",
  "When was the last time you jerked off thinking of me?",
  "Do you like it when I make the first move?",
  "Do you have a name for your thing and what is it?",
  "Do you get an instant erection when you see someone naked?",
  "If you had to choose between getting head or having sex, which would you pick?",
  "Do you think I'm sexy?",
  "What is your favorite thing to do with my body?",
  "Do you like it when people can hear us having sex?",
  "When are u coming to sex me?",
  "When am I coming to make u feed good?",
  "If u were shy to ask for the sex while we are inside, will u tell me through your phone?",
  "Do u like condom to be fixed in your presence or your obsence?",
  "Do you think my dick will enter your pussy?",
  "If your p**y was so tight for my d*k, wat will u do when u are in the mood?",
  "If you were crying while I was penetrating should I stop?",
  "If my dick was on your pussy, were should I put my hands when sex is going on?",
  "Which do you prefer, eyes opend, or eyes closed while having sex?",
  "Will u Send me a photo of how my dick should be inside your p***y",
  "Will u Send me a photo of how my p**y should be inside your d*k",
  "When was a time you were so turned on you couldn't stand it?",
  "Do you ever just want to tear off my clothes?",
  "Would you prefer to see me in hot pants or a short skirt?",
  "Will u like it if I fuck you for 2 minutes?",
  "How do you like your breasts and nipples played with?",
  "When did you first learn about sex?",
  "How much eye contact do you like to have during sex?",
  "What's the sexiest movie you've ever watched?",
  "What's your favorite pair or underwear?",
  "Using three words, how do you feel about me?",
  "How do you want me?",
  "Would you like to know how I feel about you?",
  "Where would you like to have sex My place or yours?",
  "If I was at your window right now, would you invite me in?",
  "If you could kiss me goodnight every night, would you?",
  "Would you like the cap of my dick being robbed on your pussy before entering?",
  "Would you be loud or quiet during sex?",
  "Do you prefer to take control or be submissive?",
  "What would you like me to do more in bed?",
  "Is your ass soft ?",
  "What is your favorite position when you are on top?",
  "What is your favorite kind of kiss?",
  "Do you like when I take you in deep or when you take me in deep?",
  "Will you like it when I touch you there?",
  "Have u ever felt horny while texting on the phone?",
  "Who was the first girl that touch your dick?",
  "who was the first boy that touch your ass?",
  "Which girl do u think would give you the best sex?",
  "Should u prefer we watch pron before sex?",
  "Which boy do u think would give you the best sex?",
  "Who do u fantasize when u think about sex?",
  "Have you ever gone a whole day without wearing underwear?",
  "What would you do if I answered the door naked?",
  "If I was sexing u and my dick drove out from your pussy, will u put it back ur self, or should I be the one to put it back my self?",
  "Will u be mad if I already made u wet by robbing my dick ontop your pussy and didn't do any tin?",
  "Will u like your breast to be sucked"
];

  const emojis = [
  "❤️", "😊", "😂", "😍", "🥰", "😭", "😱", "😎", "🤔", "👍", "👎", "🔥", "💯", "✨", "🎉", "💔", "😢", "😡", "🤗", "😴",
  "😘", "😋", "😛", "😜", "😝", "🤪", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😤",
  "😠", "😦", "😧", "😨", "😰", "😥", "😓", "🤗", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😯", "😦", "😧", "😮", "😲", "🥱",
  "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👻", "💀", "☠️", "👽", "👾",
  "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🙈", "🙉", "🙊", "🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮",
  "🐩", "🐺", "🦊", "🦝", "🐱", "🐈", "🦁", "🐯", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🐮", "🐂", "🐃", "🐄", "🐷",
  "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦏", "🦛", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐿️", "🦔",
  "🦇", "🐻", "🐨", "🐼", "🦥", "🦦", "🦡", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🕊️", "🦅", "🦆", "🦢", "🦉", "🦩",
  "🦚", "🦜", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🐳", "🐋", "🐬", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🐌",
  "🦋", "🐛", "🐜", "🐝", "🐞", "🦗", "🕷️", "🕸️", "🦂", "🦟", "🦠", "💐", "🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷",
  "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🍄", "🌰", "🦠", "🎃", "🎄", "🎋", "🎍", "🎎", "🎏",
  "🎐", "🎀", "🎁", "🎗️", "🎟️", "🎫", "🎖️", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "⚾", "🥎", "🏀", "🏈", "⚽", "🏉", "🎾", "🥏",
  "🎳", "🏏", "🏑", "🏒", "🥍", "🏓", "🏸", "🥅", "🏒", "🏓", "🏸", "🥊", "🥋", "🥌", "🎿", "⛷️", "🏂", "🏋️‍♀️", "🏋️‍♂️", "🤺", "🤾‍♀️",
  "🤾‍♂️", "🏌️‍♀️", "🏌️‍♂️", "🏇", "🧘‍♀️", "🧘‍♂️", "🏄‍♀️", "🏄‍♂️", "🏊‍♀️", "🏊‍♂️", "🤽‍♀️", "🤽‍♂️", "🚣‍♀️", "🚣‍♂️", "🧗‍♀️", "🧗‍♂️", "🚵‍♀️", "🚵‍♂️", "🚴‍♀️", "🚴‍♂️",
  "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹‍♀️", "🤹‍♂️", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁",
  "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰", "🧩", "🎨", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️",
  "💽", "💾", "💿", "📀", "🧮", "🎥", "📺", "📻", "📷", "📸", "📹", "📼", "🔍", "🔎", "🕯️", "💡", "🔦", "🏮", "🪔", "📔", "📕",
  "📖", "📗", "📘", "📙", "📚", "📓", "📒", "📃", "📜", "📄", "📰", "🗞️", "📑", "🔖", "🏷️", "💰", "🪙", "💴", "💵", "💶", "💷",
  "🪙", "💳", "🧾", "💸", "💱", "💲", "✉️", "📧", "📨", "📩", "📤", "📥", "📦", "📫", "📪", "📬", "📭", "📮", "🗳️", "🪧", "🏣",
  "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋", "⛲",
  "⛺", "🌁", "🌃", "🏙️", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️", "🎠", "🎡", "🎢", "💈", "🎪", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇",
  "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🛻", "🚚",
  "🚛", "🚜", "🏎️", "🏍️", "🛵", "🦽", "🦼", "🛴", "🚲", "🛶", "🛥️", "🚁", "🛩️", "✈️", "🛫", "🛬", "🪂", "💺", "🛰️", "🚀",
  "🛸", "🛎️", "🧳", "⌛", "⏰", "⏱️", "⏲️", "🕰️", "🕛", "🕧", "🕐", "🕜", "🕑", "🕝", "🕒", "🕞", "🕓", "🕟", "🕔", "🕠",
  "🕕", "🕡", "🕖", "🕢", "🕗", "🕣", "🕘", "🕤", "🕙", "🕥", "🕚", "🕦", "🕙", "🕥", "🕚", "🕦", "🌑", "🌒", "🌓", "🌔", "🌕",
  "🌖", "🌗", "🌘", "🌙", "🌚", "🌛", "🌜", "🌡️", "☀️", "🌝", "🌞", "⭐", "🌟", "🌠", "☁️", "⛅", "⛈️", "🌤️", "🌥️", "🌦️", "🌧️",
  "🌨️", "🌩️", "🌪️", "🌫️", "🌬️", "🌈", "☂️", "☔", "⚡", "❄️", "☃️", "⛄", "☄️", "💧", "🔥", "🌊", "🎃", "🎄", "🎋", "🎍", "🎎",
  "🎏", "🎐", "🎀", "🎁", "🎗️", "🎟️", "🎫", "🎖️", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "⚾", "🥎", "🏀", "🏈", "⚽", "🏉", "🎾", "🥏"
];

  useEffect(() => {
    if (isInSession) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || "ws://localhost:4000";
      const socket = io(socketUrl);
      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        setConnectionStatus("Connected");
        console.log("Connected to server");
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
        setConnectionStatus("Disconnected");
        console.log("Disconnected from server");
      });

      socket.on("connect_error", (error) => {
        setIsConnected(false);
        setConnectionStatus("Connection failed");
        console.error("Connection error:", error);
      });

      socket.emit("join-session", { sessionId, playerName: playerName || user?.username || "Anonymous" });

      socket.on("user-joined", (data) => {
        setPartnerOnline(true);
        const joinedPlayerName = data.playerName || "Partner";
        setMessages((prev) => [...prev, {
          text: `${joinedPlayerName} joined the session`,
          sender: "System",
          timestamp: new Date()
        }]);
        console.log("Partner joined:", data);
      });

      socket.on("user-left", (data) => {
        setPartnerOnline(false);
        const leftPlayerName = data.playerName || "Partner";
        setMessages((prev) => [...prev, {
          text: `${leftPlayerName} left the session`,
          sender: "System",
          timestamp: new Date()
        }]);
        console.log("Partner left:", data);
      });

      socket.on("chat message", (msg: {text: string, sender: string, timestamp: string | Date, playerName?: string}) => {
        // Convert timestamp to Date object if it's a string
        const messageWithDate = {
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
          sender: msg.playerName || msg.sender // Use playerName if available, otherwise fallback to sender
        };
        setMessages((prev) => [...prev, messageWithDate]);
      });

      socket.on("question-asked", (data: {question: string, playerName?: string}) => {
        setCurrentQuestion(data.question);
        setShowQuestionDialog(true);
        // Optionally show who asked the question
        if (data.playerName) {
          setMessages((prev) => [...prev, {
            text: `${data.playerName} asked: ${data.question}`,
            sender: "System",
            timestamp: new Date()
          }]);
        }
      });

      socket.on("question-answered", (data: {question: string, answer: string, sender: string, playerName?: string}) => {
        const answererName = data.playerName || (data.sender === "You" ? "Partner" : "You");
        setMessages((prev) => [...prev, {
          text: `Q: ${data.question}\nA: ${data.answer}`,
          sender: answererName,
          timestamp: new Date()
        }]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isInSession, sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewSession = () => {
    // Generate a more unique session ID with timestamp
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const newSessionId = `${timestamp}${random}`.toUpperCase();
    setSessionId(newSessionId);
    
    // If user is not logged in, show name dialog
    if (!user) {
      setShowNameDialog(true);
    } else {
      setIsInSession(true);
    }
  };

  const joinSession = () => {
    if (sessionId.trim()) {
      // If user is not logged in, show name dialog
      if (!user) {
        setShowNameDialog(true);
      } else {
        setIsInSession(true);
      }
    }
  };

  const handleNameSubmit = () => {
    if (playerName.trim()) {
      setShowNameDialog(false);
      setIsInSession(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && socketRef.current && isConnected) {
      const currentPlayerName = playerName || user?.username || "Anonymous";
      const message = {
        text: messageInput,
        sender: currentPlayerName,
        timestamp: new Date()
      };
      socketRef.current.emit("chat message", { ...message, sessionId });
      // Add message locally with the current player name
      setMessages((prev) => [...prev, { ...message, sender: currentPlayerName }]);
      setMessageInput("");
    }
  };

  const sendEmoji = (emoji: string) => {
    if (socketRef.current && isConnected) {
      const currentPlayerName = playerName || user?.username || "Anonymous";
      const message = {
        text: emoji,
        sender: currentPlayerName,
        timestamp: new Date()
      };
      socketRef.current.emit("chat message", { ...message, sessionId });
      setMessages((prev) => [...prev, { ...message, sender: currentPlayerName }]);
    }
  };

  const askQuestion = (questionNumber: number) => {
    const question = questions[questionNumber - 1];
    if (socketRef.current && isConnected) {
      const currentPlayerName = playerName || user?.username || "Anonymous";
      socketRef.current.emit("ask-question", { question, sessionId, playerName: currentPlayerName });
      setMessages((prev) => [...prev, {
        text: `Asked: ${question}`,
        sender: currentPlayerName,
        timestamp: new Date()
      }]);
    }
    setShowNumberSelector(false);
  };

  const handleQuestionAnswer = () => {
    if (questionAnswer.trim() && socketRef.current) {
      const currentPlayerName = playerName || user?.username || "Anonymous";
      // Emit the question answer event to both players
      socketRef.current.emit("question-answer", {
        question: currentQuestion,
        answer: questionAnswer,
        sender: "You",
        playerName: currentPlayerName,
        sessionId
      });
      
      setQuestionAnswer("");
      setShowQuestionDialog(false);
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
  };

  if (!isInSession) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-slate-200 dark:from-slate-900 dark:via-purple-900 dark:to-slate-800 flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-sm sm:max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-purple-200 dark:border-purple-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-purple-800 dark:text-purple-200">
              Join Lover's Code Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Button
              onClick={createNewSession}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Session
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter Session ID"
                className="border-purple-300 focus:border-purple-500"
              />
              <Button 
                onClick={joinSession}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                disabled={!sessionId.trim()}
              >
                <Users className="w-4 h-4 mr-2" />
                Join Session
              </Button>
            </div>
              </CardContent>
            </Card>
                </div>
    );
  }

  return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-purple-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div>
            <h1 className="font-semibold text-sm sm:text-base">Lover's Code</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <span className="text-purple-100">Session: {sessionId}</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-purple-100">{connectionStatus}</span>
              </div>
              {partnerOnline && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-green-200">Partner online</span>
                </div>
              )}
            </div>
          </div>
        </div>
                    
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/solo')}
            className="text-white hover:bg-purple-600/20"
          >
            <Heart className="w-4 h-4 mr-1" />
            Solo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ai-companion-onboarding')}
            className="text-white hover:bg-purple-600/20"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            AI Companion
          </Button>
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-purple-600/20">
                <Share2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <Badge variant="secondary" className="font-mono">{sessionId}</Badge>
                  <Button size="sm" onClick={copySessionId}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                  Share via...
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mobile Hamburger Menu */}
        <HamburgerMenu 
          currentPage="multiplayer" 
          sessionId={sessionId}
          onCopySessionId={copySessionId}
        />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Users className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const currentPlayerName = playerName || user?.username || "Anonymous";
          const isOwnMessage = msg.sender === "You" || msg.sender === currentPlayerName;
          const isSystemMessage = msg.sender === "System";
          
          return (
            <div key={idx} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                isOwnMessage 
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" 
                  : isSystemMessage
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}>
                {!isSystemMessage && (
                  <p className="text-xs font-medium opacity-80 mb-1">
                    {isOwnMessage ? currentPlayerName : msg.sender}
                  </p>
                )}
                <p className="text-xs sm:text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString() : new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Popover open={showNumberSelector} onOpenChange={setShowNumberSelector}>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                disabled={!isConnected}
              >
                <Hash className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 h-96 overflow-y-auto">
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 400 }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant="outline"
                    size="sm"
                    onClick={() => askQuestion(i + 1)}
                    className="text-xs border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                disabled={!isConnected}
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-1">
                {emojis.map((emoji, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    onClick={() => sendEmoji(emoji)}
                    className="text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    {emoji}
                  </Button>
                ))}
        </div>
            </PopoverContent>
          </Popover>

          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={!isConnected ? "Connecting..." : !partnerOnline ? "Waiting for partner..." : "Type a message..."}
            className="flex-1 border-purple-300 focus:border-purple-500 text-sm"
            disabled={!isConnected}
          />
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 px-3 sm:px-4"
            disabled={!isConnected || !messageInput.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Name Dialog for Anonymous Users */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Please enter your name to join the session. This will be visible to other players.
            </p>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name..."
              className="border-purple-300 focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  handleNameSubmit();
                }
              }}
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowNameDialog(false)}
                className="flex-1 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNameSubmit}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                disabled={!playerName.trim()}
              >
                Join Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question for you</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">{currentQuestion}</p>
            <Input
              value={questionAnswer}
              onChange={(e) => setQuestionAnswer(e.target.value)}
              placeholder="Your answer..."
              className="border-purple-300 focus:border-purple-500"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowQuestionDialog(false)}
                className="flex-1 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
              >
                Skip
              </Button>
              <Button 
                onClick={handleQuestionAnswer}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                disabled={!questionAnswer.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiplayerPage;