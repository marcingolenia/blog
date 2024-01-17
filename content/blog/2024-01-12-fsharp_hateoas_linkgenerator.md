---
title: Let's try .net LinkGenerator, will it make working with links easier?
description: >-
    This is a continuation to "HATEOAS in F#" post. Let's try to simplify link generatrion in our Hogwarts accommodation API. 
date: 2024-01-08T23:29:21+05:30
draft: true
tags:
  - fsharp
  - rest
image: /images/restglory.png
---
## Intro
This is 2nd post in this 3-post series:
I will divide the topic into 3 parts:
1. [HATEOAS in F#](/blog/2023-12-23-fsharp_hateoas/) + [source code](https://github.com/marcingolenia/hateoas_fsharp)
2. Let's try LinkGenerator to see if it can simplify HATEOAS implementation (this post) + [source code](https://github.com/marcingolenia/hateoas_fsharp/tree/link_generator)
3. Consuming RESTful API and leveraging HATEOAS in F# Fable app (coming soon)

Some libraries have built-in mechanics which can help us in creating HATEOAS. In spring we have `WebMvcLinkBuilder`, in .net MVC we have `IUrlHelper`, now in .net core minimal APIs we have `LinkGenerator`. Let's check if this can actually help. [Here](https://github.com/marcingolenia/hateoas_fsharp/tree/link_generator) you can find the updated code.

### What is LinkGenerator
From MSDN [1] docs:

> LinkGenerator efines a contract to generate absolute and related URIs based on endpoint routing.

I've found an example in C# on a blog [2]: 

Some endpoints:
```csharp
app.MapGet("/messages", Ok<List<TextMessageDto>> () =>
{
    List<TextMessageDto> textMessages = new()
    {
        new TextMessageDto { Id = 1, Message = "Hello, World!"},
        new TextMessageDto { Id = 1, Message = "Yet another Hello, World!"}
    };
    return TypedResults.Ok(textMessages);
}).WithName("readmessages");

app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id) =>
{
    //TODO : Implement a lookup for messages
    return TypedResults.Ok(new TextMessageDto { Id = id, Message = $"Hello, World! The id is {id}" });
}).WithName("readmessagebyid");

app.MapPut("/messages/{id}", (...) =>
{
    //update message
}).WithName("updatemessage");

app.MapDelete("/messages/{id}", (...) =>
{
    //delete message
}).WithName("deletemessage");
```

And an endpoint that uses LinkGenerator:
```csharp
//use the LinkGenerator class to build the url for each endpoint by using the endpointname associated with each endpoint 
app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id, HttpContext httpContext, LinkGenerator linkGenerator) =>
{
    TextMessageDto textMessage = new() { Id = id, Message = $"Hello, World from {id}" };
    List<LinkDto> links = new()
    {
        new LinkDto(linkGenerator.GetUriByName(httpContext, "readmessagebyid",values: new{id})!, "self", "GET"),
        new LinkDto(linkGenerator.GetUriByName(httpContext, "updatemessage",values: new{id})!, "update_message", "PUT"),
        new LinkDto(linkGenerator.GetUriByName(httpContext, "deletemessage",values: new{id})!, "delete_message", "DELETE")
    };
    textMessage.Links = links;
    return TypedResults.Ok(textMessage);
})
.WithName("readmessagebyid");
```
I see some tradeoffs:
1. It looks that it can save us from some troubles when we want to do some changes in our API that involve changing URI paths as we 
can refer to an endpoint by name instead of the full API path, but we have to bother now with naming the endpoints.
2. We don't have to hardcode paths versus we have to hardcode endpoint names.
3. While in C# we can get some extra typesafety (in C# string interpolation actually doesn't check the types), we can have the same benefit in F# by using typed interpolated strings, so let's pretend that this point doesn't exist (as this is blog post about F# not C#).

So... I am somewhat sceptical but let's go. We have to try it, before I can make an opinion.

## Using Link Generator in F# Giraffe
LinkGenerator can be retrieved from services by quering .net HttpContext like so;
```fsharp
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let linker = ctx.GetService<LinkGenerator>()
```
The most important 2 methods are `GetPathByName` and `GetUriByName`. Let's consider `http://localhost/accommodation/houses/Gryffindor`. The first will return the path - so `/accommodation/houses/Gryffindor` from the URL, the second will include the protocol and domain name. Both are good - depends if You want the client to handle the protocol and domain or if You want to provide full URL.

### Giraffe uses format strings...
Yup. So in C# You have this:
```csharp
app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id) =>
```
in F# You have this:
```fsharp
 GET [
       routef "/messages/%s" func test 
     ]
```
In C# You can pass an object for the route values. It is then used to expand parameters in the route template with matching property name ("id" in this case): 
```
linkGenerator.GetPathByName("readmessagebyid",values: new{id})
```
in F#... well: 
```
linker.GetPathByName("get_houses_by", {|s0 = houseName |})
```
at least in Giraffe. When there are more route values then You increase the number: s0, s1, s2 and so on. Not that nice but yeah... I can accept this.


### Other frameworks - Let's try in Falco
### Adding it to our API
The endpoint definition will change slightly (names are just added): 
```fsharp
let endpoints =
    [
      OPTIONS [
          route "/" readOptions
      ]
      GET [
            routef "/houses/%s/students" readStudentsBy |> addMetadata(EndpointNameMetadata "get_house_students") 
            routef "/houses/%s" readHouseBy |> addMetadata(EndpointNameMetadata "get_houses_by") 
            route "/houses" readHouses |> addMetadata(EndpointNameMetadata "get_houses")
          ]
      DELETE [
          routef "/houses/%s/students/%s" deleteStudentBy
      ]
    ]
```
and let's see how the `route "/houses" readHouses` looks like: 
```fsharp
let readHouses: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let linker = ctx.GetService<LinkGenerator>()
        let data =
            houses
            |> List.map (fun house ->
                { Name = house.Name.ToString()
                  Links =
                    [ { Rel = "self"
                        Href = linker.GetPathByName("get_houses_by", {|s0 = house.Name.ToString()|}) }
                      { Rel = "all_students"
                        Href = linker.GetPathByName("get_house_students", {|s0 = house.Name.ToString()|})}
                    ]})
        json data next ctx
```

## Conclusions
I don't have to think about parent path in my routing. This in my eyes is a big benefit as the module gains more autonomy. The s0,s1,s2... i0 etc may look bad, but at the end of the day I love to have format strings as part of my routing which automatically can validate my handler function paramater types. I am going to use LinkGenerator. 
The final conclusion is that is it worth to test a thing by your own before you give a rigid opinion. 

---
**References:**\
[1] [MSDN LinkGenerator](https://learn.microsoft.com/pl-pl/dotnet/api/microsoft.aspnetcore.routing.linkgenerator)\
[2] [Minimal APIs and HATEOAS, Poornima Nayar](https://poornimanayar.co.uk/blog/minimal-apis-and-hateoas)\
[3] https://github.com/giraffe-fsharp/Giraffe/issues/569
[4] [Full source code](https://github.com/marcingolenia/hateoas_fsharp/tree/link_generator)