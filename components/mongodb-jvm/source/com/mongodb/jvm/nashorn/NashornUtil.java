/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.nashorn;

import org.bson.codecs.configuration.CodecRegistries;
import org.bson.codecs.configuration.CodecRegistry;

/**
 * @author Tal Liron
 */
public class NashornUtil
{
	public static CodecRegistry newCodecRegistry( CodecRegistry next )
	{
		return CodecRegistries.fromRegistries(
			CodecRegistries.fromCodecs( new ConsStringCodec(), new NativeBooleanCodec(), new NativeDateCodec(), new NativeNumberCodec(), new NativeRegExpCodec(), new NativeStringCodec(), new UndefinedCodec() ),
			CodecRegistries.fromProviders( new NashornCodecProvider() ), next );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private NashornUtil()
	{
	}
}
